import { supabase } from '../lib/supabaseClient';
import { LearningPath, CourseDetail } from '../types/schema';

// Ambil semua Roadmap
export const fetchRoadmaps = async (): Promise<LearningPath[]> => {
    const { data, error } = await supabase.rpc('get_learning_paths_with_progress');
    if (error) throw error;
    return data || [];
};

// Ambil Materi dalam satu Roadmap
export const fetchCourseDetails = async (pathId: number): Promise<CourseDetail[]> => {
    const { data, error } = await supabase.rpc('get_courses_by_learning_path', {
        p_learning_path_id: pathId
    });
    if (error) throw error;
    return data || [];
};

// Update Ceklis
export const updateProgress = async (courseId: number, isGraduated: boolean) => {
    const { error } = await supabase.rpc('set_course_progress', {
        p_course_id: courseId,
        p_is_graduated: isGraduated
    });
    if (error) throw error;
};