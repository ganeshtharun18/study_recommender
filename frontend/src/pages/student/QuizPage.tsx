import { useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
//import { ApiQuiz } from "@/pages/student/Quizzes; 

interface ApiQuiz {
  id: number;
  topic: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
}


const QuizPage = () => {
  const { topic } = useParams();
  const { state } = useLocation();
  const questions = state?.questions as ApiQuiz[];

  if (!questions || !questions.length) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Quiz: {topic}</h1>
        <p className="text-red-500">No questions found for this quiz</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Quiz: {topic}</h1>
      
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">
              {index + 1}. {question.question}
            </h3>
            <div className="space-y-2">
              {['A', 'B', 'C', 'D'].map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="radio"
                    id={`q${index}-${option}`}
                    name={`q${index}`}
                    value={option}
                    className="mr-2"
                  />
                  <label htmlFor={`q${index}-${option}`}>
                    {question[`option_${option.toLowerCase()}` as keyof typeof question]}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button className="bg-edu-primary hover:bg-edu-primary/90">
          Submit Quiz
        </Button>
      </div>
    </div>
  );
};

export default QuizPage;