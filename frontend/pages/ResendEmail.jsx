import React, { useState } from 'react'
import BaseAuthDesign from '../components/Auth/BaseAuthDesign'
import { Navigate, useLocation } from 'react-router-dom'
import AuthInput from '../components/Auth/AuthInput';
import AuthButton from '../components/Auth/AuthButton';
import authService from '../services/authService';
import Toast from '../components/Toast';
import { useToast } from '../contexts/ToastContext';

const ResendEmail = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const {success} = useToast();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await authService.resendVerification(email);
    setLoading(false);
    success("If email exists, mail is sent!")
  }
  return (
    <BaseAuthDesign title={"RESEND EMAIL VERIFICATION"}>
      <form onSubmit={handleSubmit}>
        <AuthInput 
        label={"Email"}
        placeholder={"Enter your email"}
        type={"email"}
        required
        value = {email}
        onChange={(e)=>setEmail(e.target.value)}
        />
        <AuthButton name={"Resend mail"} isSubmitting={loading}/>
      </form>
    </BaseAuthDesign>
  )
}

export default ResendEmail