
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen, User, Users, BarChart } from "lucide-react";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-edu-primary/90 to-edu-secondary/90 text-white py-16 sm:py-24">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Your Personal Study Material Recommender
              </h1>
              <p className="text-xl opacity-90">
                Discover tailored learning resources, track your progress, and achieve your
                educational goals with personalized recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-white text-edu-primary hover:bg-white/90 px-6"
                  onClick={() => navigate("/register")}
                >
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-white border-white hover:bg-white/10 px-6"
                  onClick={() => navigate("/login")}
                >
                  Log In
                </Button>
              </div>
            </div>
            <div className="hidden md:flex justify-end">
              <div className="relative w-full max-w-md">
                <div className="absolute top-0 left-0 w-full h-full bg-white/10 rounded-xl blur-xl"></div>
                <div className="relative bg-white/30 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-edu-primary">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium">Personalized Learning</h3>
                        <p className="text-sm opacity-80">Tailored to your needs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-edu-primary">
                        <BarChart size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium">Progress Tracking</h3>
                        <p className="text-sm opacity-80">Monitor your achievements</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-edu-primary">
                        <Users size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium">Collaborative Learning</h3>
                        <p className="text-sm opacity-80">Learn with peers</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Designed for Everyone</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform caters to students, teachers, and administrators with
              role-specific features designed to enhance the educational experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Student Features */}
            <div className="edu-card p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="w-12 h-12 rounded-lg bg-edu-primary/10 flex items-center justify-center text-edu-primary mb-4">
                <User className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Students</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Access personalized study materials</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Track learning progress with analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Take quizzes and assessments</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Get recommendations based on performance</span>
                </li>
              </ul>
              <Button className="mt-6 w-full bg-edu-primary hover:bg-edu-primary/90" onClick={() => navigate("/register")}>
                Join as Student
              </Button>
            </div>

            {/* Teacher Features */}
            <div className="edu-card p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-12 h-12 rounded-lg bg-edu-secondary/10 flex items-center justify-center text-edu-secondary mb-4">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Teachers</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Upload and manage learning materials</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Create quizzes and assignments</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Track student progress and engagement</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Access teaching analytics and insights</span>
                </li>
              </ul>
              <Button className="mt-6 w-full bg-edu-secondary hover:bg-edu-secondary/90" onClick={() => navigate("/register")}>
                Join as Teacher
              </Button>
            </div>

            {/* Admin Features */}
            <div className="edu-card p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="w-12 h-12 rounded-lg bg-edu-accent/10 flex items-center justify-center text-edu-accent mb-4">
                <BarChart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Administrators</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Manage users and their roles</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Monitor platform-wide analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Approve and organize content</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Configure system settings</span>
                </li>
              </ul>
              <Button variant="outline" className="mt-6 w-full" onClick={() => navigate("/login")}>
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-muted">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Enhance Your Learning?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Join our educational platform today and discover a new way to learn, teach, and grow.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-edu-primary hover:bg-edu-primary/90 px-8" onClick={() => navigate("/register")}>
              Create Account
            </Button>
            <Button size="lg" variant="outline" className="px-8" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
