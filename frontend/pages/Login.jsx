import React, { useState } from 'react'
import BaseAuthDesign from '../components/Auth/BaseAuthDesign'
import Toast from '../components/Toast'
import { useForm } from "react-hook-form"
import AuthInput from '../components/Auth/AuthInput'
import Loading from "../components/Loading"
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Google from '../src/assets/Google'
import AuthGoogle from '../components/Auth/AuthGoogle'
import AuthButton from '../components/Auth/AuthButton'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const { register, formState: { errors, isSubmitting }, handleSubmit } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState({
    type: "",
    message: ""
  });

  useState(()=>{
    if(location.state){
      setToast({
        type: Object.keys(location.state),
        message: Object.values(location.state)
      })
    }
  }, [location.state])

  const onSubmit = async (data) => {
    try {
      await login(data);
      navigate('/');
    } catch (err) {
      console.log(err.response?.data || err.response?.data.verification || "Something went wrong, please try again!");
      setToast({
        type: "error",
        message: err.response?.data?.error || err.response?.data?.verification || "Something went wrong, please try again!"
      })
    }
  }

  return (
    <BaseAuthDesign title={"LOGIN"}>
      <Toast type={toast.type} message={toast.message} setMessage={(msg) => setToast({ ...toast, message: msg })} />
      <form onSubmit={handleSubmit(onSubmit)}>
        <AuthInput
          label={"Email"}
          placeholder={"Enter your email"}
          type={"email"}
          error={errors.email?.message}
          {...register("email", {
            required: "Email is required"
          })}
        />
        <AuthInput
          label={"Password"}
          placeholder={"**************"}
          type={"password"}
          error={errors.password?.message}
          {...register("password", {
            required: "Password is required"
          })}
        />
        <AuthButton name={"Login"} isSubmitting={isSubmitting}/>
        <div className='text-center'>
          <Link to={"/forgot-password"} className='text-sm italic text-blue-700'>Forgot your password?</Link>
        </div>
        <div className='text-center'>
          <Link to={"/resend-email"} className='text-sm italic text-green-700'>Resend verification</Link>
        </div>  
      </form>
      <AuthGoogle />
      <div className="text-sm text-center mt-4 italic">
        Don't have an account yet?{" "}
        <Link to="/signup" className="text-blue-500">
          Signup
        </Link>
      </div>
    </BaseAuthDesign>
  )

}
export default Login