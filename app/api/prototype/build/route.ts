import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { buildPrototype } from '@/lib/prototype/builder';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch the project
    const { data: project, error: projectError } = await supabase
      .from('prototype_projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch all screens for this project
    const { data: screens, error: screensError } = await supabase
      .from('prototype_screens')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (screensError) {
      return NextResponse.json({ error: 'Failed to fetch screens' }, { status: 500 });
    }

    // Build the prototype HTML
    const html = buildPrototype({
      screens: (screens || []).map(screen => ({
        name: screen.screen_name,
        html: screen.html_content,
        isRoot: screen.is_root,
      })),
      platform: project.platform as 'mobile' | 'desktop',
      projectName: project.name,
    });

    return NextResponse.json({ html, screenCount: screens?.length || 0 });
  } catch (error) {
    console.error('Error building prototype:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
