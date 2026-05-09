import React, { useState } from 'react'
import BaseAuthDesign from '../components/Auth/BaseAuthDesign'
import { Navigate, useLocation } from 'react-router-dom'
import AuthInput from '../components/Auth/AuthInput';
import AuthButton from '../components/Auth/AuthButton';
import authService from '../services/authService';
import Toast from '../components/Toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await authService.forgotPassword(email);
    setLoading(false);
    setToast("If email exists, mail is sent!")
  }
  return (
    <BaseAuthDesign title={"FORGOT PASSWORD"}>
      <Toast message={toast} type='success' setMessage={setToast} />
      <form onSubmit={handleSubmit}>
        <AuthInput 
        label={"Email"}
        placeholder={"Enter your email"}
        type={"email"}
        required
        value = {email}
        onChange={(e)=>setEmail(e.target.value)}
        />
        <AuthButton name={"Send mail"} isSubmitting={loading}/>
      </form>
    </BaseAuthDesign>
  )
}

export default ForgotPassword