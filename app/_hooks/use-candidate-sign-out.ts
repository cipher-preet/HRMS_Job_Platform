"use client";

import { useRouter } from "next/navigation";
import { baseApi } from "../_redux/api/baseApi";
import { useCandidateSignOutMutation } from "../_redux/api/AuthApi";
import { useAppDispatch } from "../_redux/hooks";

export const AUTH_STORAGE_KEY = "hireondeck-auth";

export function useCandidateSignOut() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [candidateSignOut, { isLoading }] = useCandidateSignOutMutation();

  async function signOut() {
    try {
      await candidateSignOut().unwrap();
    } catch {
      // Signing out remains idempotent locally even if the server is unreachable.
    } finally {
      localStorage.setItem(AUTH_STORAGE_KEY, "signed-out");
      dispatch(baseApi.util.resetApiState());
      router.push("/profile");
    }
  }

  return {
    isSigningOut: isLoading,
    signOut,
  };
}
