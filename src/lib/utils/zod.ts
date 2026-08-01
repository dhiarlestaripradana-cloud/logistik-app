import { z } from "zod";

// String opsional: "" dari FormData dianggap kosong (undefined).
export const optionalStr = (max = 255) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

// Tanggal opsional: "" tidak boleh jadi Invalid Date.
export const optionalDate = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.date().optional()
);

// Enum opsional dari <select> yang boleh kosong.
export const optionalEnum = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.enum(values).optional());

// id tersembunyi di form: "" berarti mode create.
export const optionalId = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.string().uuid().optional()
);
