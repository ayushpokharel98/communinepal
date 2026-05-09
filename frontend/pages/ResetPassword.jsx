import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import authService from '../services/authService';
import Loading from '../components/Loading';
import BaseAuthDesign from '../components/Auth/BaseAuthDesign';
import AuthInput from '../components/Auth/AuthInput';
import AuthButton from '../components/Auth/AuthButton';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword = () => {
  const { uidb64, token } = useParams();
  const [loading, setLoading] = useState(false);
  const {isAuthenticated} = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const checkToken = async () => {
      try{
        setLoading(true);
        await authService.validateResetToken({ uidb64, token });
        setLoading(false)
      }catch{
        navigate('/', {replace:true})
      }
    }
    checkToken();
  }, [])

  const [password, setPassword] = useState('');
  const [isSubmitting, setisSubmitting] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async(e)=>{
    e.preventDefault();
    try{
      setisSubmitting(true);
      await authService.resetPassword({uidb64, token, new_password: password});
      navigate(isAuthenticated?"/":"/login", {state:{"success":"Password Reset Successfull!"}, replace:true})
    }catch(err){
      const passErr = err.response?.data?.new_password?.join("\n")
      if(passErr){
        setError(passErr)
      }
    }finally{
      setisSubmitting(false)
    }
  }
  return ( loading ? <Loading type={1} /> :
    <BaseAuthDesign title={"CHANGE PASSWORD"}>
      <form onSubmit={handleSubmit}>
        <AuthInput
        label={"Password"}
        placeholder={"**************"}
        type={"password"}
        error={error}
        required
        value = {password}
        onChange = {(e)=>setPassword(e.target.value)}
         />
         <AuthButton name={"Change"} isSubmitting={isSubmitting} />
      </form>
    </BaseAuthDesign>
  )
}

export default ResetPassword