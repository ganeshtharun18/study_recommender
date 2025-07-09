import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { submitQuiz } from "@/lib/api"; // Make sure this exists
import { toast } from "@/components/ui/use-toast";

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
  const { user } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();
  const questions = state?.questions as ApiQuiz[];

  const [answers, setAnswers] = useState<{ id: number; selected: string }[]>(
    questions?.map((q) => ({ id: q.id, selected: "" })) || []
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!questions || questions.length === 0) {
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

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index].selected = value;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    setError("");
    if (!user?.email || !topic) {
      setError("User or topic not found.");
      return;
    }

    const unanswered = answers.find((a) => a.selected === "");
    if (unanswered) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await submitQuiz(user.email, topic, answers);
      if (response.result_id) {
        navigate(`/results/${response.result_id}`);
      } else {
        setError("Quiz submission failed. Try again.");
      }
    } catch (err: any) {
      console.error("Submit failed", err);
      setError(err.message || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Quiz: {topic}</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">
              {index + 1}. {question.question}
            </h3>
            <div className="space-y-2">
              {["A", "B", "C", "D"].map((opt) => {
                const value = opt as "A" | "B" | "C" | "D";
                const label = question[`option_${value.toLowerCase()}` as keyof typeof question];
                return (
                  <label key={opt} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`q${index}`}
                      value={value}
                      checked={answers[index].selected === value}
                      onChange={() => handleOptionChange(index, value)}
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          className="bg-edu-primary hover:bg-edu-primary/90"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Quiz"}
        </Button>
      </div>
    </div>
  );
};

export default QuizPage;
