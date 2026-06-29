/**
 * Yup validation schemas
 * Ported from Angular Reactive Forms validators
 */

import * as yup from 'yup';

const PHONE_REGEX = /^[+]?[0-9]{10,15}$/;

export const loginSchema = yup.object({
  mobile: yup
    .string()
    .required('Phone number is required')
    .matches(PHONE_REGEX, 'Enter a valid phone number'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export const registerStep1Schema = yup.object({
  firstName: yup.string().required('First name is required').min(2, 'Minimum 2 characters'),
  lastName: yup.string().required('Last name is required').min(2, 'Minimum 2 characters'),
  mobile: yup
    .string()
    .required('Phone number is required')
    .matches(PHONE_REGEX, 'Enter a valid phone number'),
  email: yup.string().required('Email is required').email('Enter a valid email'),
  dateOfBirth: yup.string().required('Date of birth is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Minimum 8 characters')
    .matches(/[A-Z]/, 'Must contain an uppercase letter')
    .matches(/[a-z]/, 'Must contain a lowercase letter')
    .matches(/[0-9]/, 'Must contain a number')
    .matches(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: yup
    .string()
    .required('Confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

export const forgotPasswordSchema = yup.object({
  email: yup.string().required('Email is required').email('Enter a valid email'),
});

export const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Minimum 8 characters')
    .matches(/[A-Z]/, 'Must contain an uppercase letter')
    .matches(/[a-z]/, 'Must contain a lowercase letter')
    .matches(/[0-9]/, 'Must contain a number'),
  confirmPassword: yup
    .string()
    .required('Confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

export const zipCodeSchema = yup.object({
  zipCode: yup
    .string()
    .required('ZIP code is required')
    .matches(/^\d{5}$/, 'Enter a valid 5-digit ZIP code'),
});

export const otpSchema = yup.object({
  code: yup
    .string()
    .required('Enter the verification code')
    .matches(/^\d{4,6}$/, 'Enter a valid code'),
});
