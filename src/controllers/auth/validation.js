import * as Yup from "yup";

export const RegisterValidationSchema = Yup.object({
  username: Yup.string()
    .min(5, "Username must be at least 5 characters")
    .matches(
      /^[a-zA-Z0-9._]+$/,
      "Username must be alphanumeric or contains . and _"
    )
    .required("Username is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters.")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter.")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .matches(/[0-9]/, "Password must contain at least one digit.")
    .matches(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character."
    )
    .required("Password is required."),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string()
    .matches(/^[0-9]+$/, "Phone number must be numeric")
    .min(10, "Phone number must be at least 10 characters")
    .max(12, "Max phone number is 12 characters")
    .required("Phone number is required"),
});

export const LoginValidationSchema = Yup.object({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
});

export const EmailValidationSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
});

export const IsEmail = async (email) => {
  return await EmailValidationSchema.isValid({ email });
};

export const ChangeUsernameValidationSchema = Yup.object({
  username: Yup.string()
    .min(5, "Username must be at least 5 characters.")
    .matches(/[a-zA-Z]/, "Username must contain at least one character.")
    .matches(
      /^[a-zA-Z0-9._]+$/,
      "Username must be alphanumeric or contains . and _"
    )
    .required("Username is required."),
});

export const ChangePasswordValidationSchema = Yup.object({
  currentPassword: Yup.string().required("Password is required."),
  newPassword: Yup.string()
    .min(6, "Password must be at least 6 characters.")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter.")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .matches(/[0-9]/, "Password must contain at least one digit.")
    .matches(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character."
    )
    .required("New password is required."),
  confirmPassword: Yup.string().oneOf(
    [Yup.ref("newPassword"), null],
    "password must match."
  ),
});

export const ChangePhoneValidationSchema = Yup.object({
  phone: Yup.string()
    .matches(/^[0-9]+$/, "Phone number must be numeric")
    .min(10, "Phone number must be at least 10 characters")
    .max(12, "Max phone number is 12 characters")
    .required("Phone number is required"),
});

export const ResetPasswordValidationSchema = Yup.object({
  newPassword: Yup.string()
    .min(6, "Password must be at least 6 characters.")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter.")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .matches(/[0-9]/, "Password must contain at least one digit.")
    .matches(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character."
    )
    .required("New password is required."),
  confirmPassword: Yup.string().oneOf(
    [Yup.ref("newPassword"), null],
    "password must match."
  ),
});
