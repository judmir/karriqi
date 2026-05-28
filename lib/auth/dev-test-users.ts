/** Local Supabase dev accounts (see supabase/seed.sql). */
export const DEV_TEST_USERS = [
  {
    id: "e18a4b29-ed05-4140-99af-9f6a8c906074",
    email: "judikarriqi@gmail.com",
    label: "Judi",
    pin: "123456",
  },
  {
    id: "fbf3f6b3-2aff-4a72-9c1d-22cda9cdf398",
    email: "savinakarriqi@gmail.com",
    label: "Savina",
    pin: "654321",
  },
] as const;

export type DevTestUser = (typeof DEV_TEST_USERS)[number];

export const LOCAL_DEV_PIN_PEPPER =
  "karriqi-local-dev-pin-pepper-v1-not-for-production";

export function findDevTestUser(userId: string): DevTestUser | undefined {
  return DEV_TEST_USERS.find((user) => user.id === userId);
}
