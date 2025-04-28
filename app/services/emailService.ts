import emailjs from '@emailjs/browser';

const EMAILJS_PUBLIC_KEY = 'xC1QMlEUFiMQaCmHA';
const EMAILJS_SERVICE_ID = 'service_1mact5a';
const EMAILJS_TEMPLATE_ID = 'template_3ns00mj';

// Initialize EmailJS
if (typeof window !== 'undefined') {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

interface EmailParams {
  to_name: string;
  to_email: string;
  message: string;
  loan_amount?: string;
  total_amount?: string;
  due_date?: string;
  interests?: string;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
}

export const sendEmail = async (params: EmailParams): Promise<boolean> => {
  try {
    console.log('Sending email with params:', params);
    
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      params
    );

    console.log('Email response:', response);
    
    if (response.status === 200) {
      console.log('Email sent successfully');
      return true;
    } else {
      console.error('Failed to send email:', response);
      return false;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}; 