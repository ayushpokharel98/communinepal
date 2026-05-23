from .token_service import TokenService
from django.conf import settings
from ..tasks import send_email_task

class EmailService:
      
    @staticmethod
    def send_verification(user):
        tokens = TokenService.generate_token(user)
        
        link = f"{settings.FRONTEND_URL}/verify-email/{tokens["uid"]}/{tokens["token"]}/"
        
        send_email_task.delay(
            subject="Verify your email",
            message=f"Click here to verify: \n {link}",
            recipient_list= [user.email],

        )
        
    @staticmethod
    def send_password_reset(user):
        tokens = TokenService.generate_token(user)
        
        link = f"{settings.FRONTEND_URL}/reset-password/{tokens["uid"]}/{tokens["token"]}/"
        
        send_email_task.delay(
            subject="Reset your password",
            message=f"Click here to verify: \n {link}",
            recipient_list= [user.email],
        )

