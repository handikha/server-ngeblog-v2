export const getCloudinaryImageName = (string) =>
  string.split("/").slice(-2).join("/").split(".").shift();
