import { useState } from "react"
import { Link } from "react-router-dom"
import CommonForm from "@/components/common/form"
import { loginFormControls } from "@/config"
import { loginUser } from "@/store/auth-slice"
import { useDispatch } from "react-redux"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const initialState = {
  email: "",
  password: "",
}

function AuthLogin() {
  const [formData, setFormData] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const { toast } = useToast()

  async function onSubmit(event) {
    event.preventDefault()
    setLoading(true)

    try {
    const response = await dispatch(loginUser(formData)).unwrap()
    console.log("Full Login Response:", response)
    
    // Store token in localStorage as mobile fallback
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }

    toast({
      title: "Login Successful",
      description: "You have successfully logged in.",
      status: "success",
    })
  } catch (error) {
      console.error("Login Error:", error)
      toast({
        title: "Login Failed",
        description: "Invalid email or password. " + error?.message,
        status: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-md border-0">
      <CardHeader className="pb-4 space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome Back!</CardTitle>
        <p className="text-sm text-center text-gray-600">
          Don't have an account?
          <Link to="/auth/register" className="ml-1 font-medium text-[#7C8E76] hover:underline">
            Sign Up
          </Link>
        </p>
      </CardHeader>
      <CardContent>
        <CommonForm
          formControls={loginFormControls}
          buttonText={loading ? "Signing In..." : "Login"}
          formData={formData}
          setFormData={setFormData}
          onSubmit={onSubmit}
          buttonDisabled={loading}
        />
      </CardContent>
    </Card>
  )
}

export default AuthLogin
