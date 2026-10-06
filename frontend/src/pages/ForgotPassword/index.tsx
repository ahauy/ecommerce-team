import FormikField from "@/components/customFieldsFormik/FormikField";
import InputField from "@/components/customFieldsFormik/InputField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import BaseUrl from "@/consts/baseUrl";
import { sleepTime } from "@/helpers/common";
import { useAuth } from "@/providers/AuthenticationProvider";
import { Form, Formik } from "formik";
import { Link, Navigate } from "react-router-dom";
import { forgotPasswordSchema } from "./schemas/forgotPassword.schema";

const ForgotPassword = () => {
  //! State
  const { toast } = useToast();
  const { isLogged } = useAuth();

  //! Render
  if (isLogged) {
    return <Navigate to={BaseUrl.Homepage} />;
  }

  return (
    <div className="component:ForgotPassword flex h-[100vh] w-[100vw] items-center justify-center p-2">
      <Formik
        validationSchema={forgotPasswordSchema}
        initialValues={{
          email: "",
        }}
        onSubmit={async (_values, { setSubmitting }) => {
          try {
            setSubmitting(true);
            await sleepTime(1000);
            toast({
              title: "Email đã được gửi",
              description: "Vui lòng kiểm tra hộp thư để nhận đường dẫn đặt lại mật khẩu.",
            });
          } catch (error) {
            toast({
              variant: "destructive",
              description: error as string,
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => {
          return (
            <Form className="min-w-[500px]">
              <Card className="shadow-md">
                <CardHeader className="pb-5">
                  <h1 className="text-xl font-semibold tracking-tight">
                    Forgot password
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Enter your registered email and
                    <br />
                    we will send you a link to reset your password.
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <FormikField
                    component={InputField}
                    name="email"
                    label="Email"
                    placeholder="your-email@gmail.com"
                    required
                  />

                  <Button type="submit" isLoading={isSubmitting} className="rounded-full">
                    Continue
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    You have an account?{" "}
                    <Link to={BaseUrl.Login} className="is-link">
                      Log in
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default ForgotPassword;
