export interface LearningPath {
    learning_path_id: number;
    learning_path_name: string;
    total_courses: number;
    total_hours: number;
    completed_courses: number;
    progress_percent: number;
}

export interface CourseDetail {
    course_id: number;
    course_name: string;
    hours_to_study: number;
    level_name: string;      // "Foundation", "Intermediate"
    is_graduated: boolean;   // Status checklist
}