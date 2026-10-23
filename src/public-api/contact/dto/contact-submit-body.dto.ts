/** HTTP layer re-export — canonical schema lives in domain validation (MSG2). */
export {
  submitContactInquirySchema as contactSubmitBodySchema,
  type SubmitContactInquiryInput as ContactSubmitBody,
} from '../../../domain/contact/contact-submit.validation';
