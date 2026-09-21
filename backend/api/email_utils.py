from django.conf import settings
from django.core.mail import send_mail


def send_quote_received_email(quote):
    send_mail(
        subject=f"New AssetHub Quote Request - {quote.company_name}",
        message=f"""
A new quote request has been submitted through AssetHub.

Customer:
{quote.full_name}

Company:
{quote.company_name}

Email:
{quote.email}

Phone:
{quote.phone or "Not provided"}

Package:
{quote.get_package_display()}

Number of Assets:
{quote.number_of_assets or "Not provided"}

Number of Users:
{quote.number_of_users or "Not provided"}

Requirements:
{quote.requirements or "No additional requirements provided."}
""",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.ASSETHUB_ADMIN_EMAIL],
        fail_silently=False,
    )


def send_quote_status_email(quote):
    status = quote.status

    messages = {
        "CONTACTED": (
            "We've received your quote request and our team "
            "will be in contact with you shortly."
        ),
        "QUOTED": (
            "Your AssetHub quote request has been reviewed and "
            "your quote is now ready. Our team will contact you "
            "with the next steps."
        ),
        "ACCEPTED": (
            "Your AssetHub quote has been accepted. Our team will "
            "contact you with the next steps for getting started."
        ),
        "DECLINED": (
            "We have reviewed your AssetHub quote request. "
            "Unfortunately, we are unable to proceed with the "
            "request at this time."
        ),
    }

    message = messages.get(status)

    if not message:
        return

    send_mail(
        subject=f"AssetHub Quote Request - {quote.get_status_display()}",
        message=f"""
Hello {quote.full_name},

{message}

Company:
{quote.company_name}

Package:
{quote.get_package_display()}

Current Status:
{quote.get_status_display()}

If you have any questions, please contact our team.

Thank you,
AssetHub
""",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[quote.email],
        fail_silently=False,
    )