import React, { useState } from 'react'
import BaseAuthDesign from '../components/Auth/BaseAuthDesign'
import { useNavigate, useParams } from 'react-router-dom'
import authService from '../services/authService';

const VerifyEmail = () => {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();
  useState(async () => {
    try {
      await authService.verifyEmail({ uidb64, token });
      navigate("/login", { state: { success: "Email verified successfully!" }, replace:true })
    } catch {
      navigate("/login", { state: { error: "Invalid Request!" }, replace:true })
    }

  }, []);
  return (
    <BaseAuthDesign>
      <p className='text-center text-2xl font-semibold'>Verifying....</p>
    </BaseAuthDesign>
  )
}

export default VerifyEmail