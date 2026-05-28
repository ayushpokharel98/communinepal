import React, { useState } from 'react'
import BaseAuthDesign from '../components/Auth/BaseAuthDesign'
import { useForm } from 'react-hook-form'
import authService from '../services/authService';
import AuthInput from '../components/Auth/AuthInput';
import Loading from '../components/Loading';
import Google from '../src/assets/Google'
import {Link} from 'react-router-dom'
import AuthGoogle from '../components/Auth/AuthGoogle';
import { useToast } from '../contexts/ToastContext';

const Signup = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, setValues } = useForm();
  const { signup } = authService;
  const {success, error} = useToast();

  const onSubmit = async (data) => {
    try {
      await signup(data);
      success(`User ${data.username} created succesfully, check your mail for verification.`);
      setValues("");
    } catch (err) {
      const serverErrors = err.response?.data
      if (serverErrors) {
        Object.entries(serverErrors).forEach(([key, values]) => {
          setError(key, {
            type: "server",
            message: values.join("\n")
          })
        })

      } else {
        error("Something went wrong, please try again later!");
      }
    }
  }
  return (
    <BaseAuthDesign title={"SIGNUP"}>
      {errors.root?.message &&
        <div className='text-center text-xs text-red-600'>
          {errors.root.message}
        </div>
      }
      <form onSubmit={handleSubmit(onSubmit)}>
        <AuthInput
          label={"Username"}
          type={"text"}
          name={"username"}
          placeholder={"Enter your username"}
          {...register("username", { required: "Username is required" })}
          error={errors.username?.message}
        />
        <AuthInput
          label={"Email"}
          type={"email"}
          placeholder={"Enter your email"}
          {...register("email", { required: "Email is required" })}
          error={errors.email?.message}
        />
        <div className='flex gap-2'>
          <AuthInput
            label={"First Name"}
            type={"text"}
            name={"first_name"}
            placeholder={"John"}
            {...register("first_name", { required: "First name is required" })}
            error={errors.first_name?.message}
          />
          <AuthInput
            label={"Last Name"}
            type={"text"}
            name={"last_name"}
            placeholder={"Doe"}
            {...register("last_name", { required: "Last name is required" })}
            error={errors.last_name?.message}
          />
        </div>
        <AuthInput
          label={"Password"}
          type={"password"}
          placeholder={"**************"}
          {...register("password", { required: "Password is required" })}
          error={errors.password?.message}
        />
        <div className="flex justify-center">
          <button
            type="submit"
            className="rounded-md bg-red-400 px-18 py-2 hover:bg-blue-400 transition-all duration-300 ease-in-out"
          >
            {isSubmitting ? <Loading /> : "Signup"}
          </button>
        </div>
      </form>
      <AuthGoogle />
      <div className="bottom text-sm text-center mt-4 italic">
        Already have an account? <Link to={"/login"} className='text-blue-500 '>Login</Link>
      </div>
    </BaseAuthDesign>
  )
}

export default Signup