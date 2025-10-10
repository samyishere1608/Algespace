export interface PretestQuestion {
  question: string;
  options: string[];
}

export interface PretestAnswers {
  [key: string]: string; // e.g., { "q1": "Very confident", "q2": "Quick practice" }
}

export interface PretestSubmission {
  UserId: number;
  Answers: PretestAnswers;
}

export interface PretestStatus {
  hasCompleted: boolean;
  suggestedGoals: string[];
}

export interface PretestResult {
  success: boolean;
  suggestedGoals: string[];
  message: string;
}

export interface PretestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (suggestedGoals: string[]) => void;
  userId: number;
}
