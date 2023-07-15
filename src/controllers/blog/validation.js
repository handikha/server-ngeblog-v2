import * as Yup from "yup";

export const BlogValidationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  content: Yup.string().required("Content is required"),
  categoryId: Yup.string().required("Category is required"),
});
