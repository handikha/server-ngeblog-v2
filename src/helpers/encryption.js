import bycript from "bcrypt";

export function hashPassword(password) {
  return bycript.hashSync(password, 10);
}

export function comparePassword(password, hash) {
  return bycript.compareSync(password, hash);
}

export function hashEmail(email) {
  return bycript.hashSync(email, 10);
}

export function compareEmail(email, hash) {
  return bycript.compareSync(email, hash);
}
