"use client";

import { useMemo } from "react";
import {
  adminBlockUser,
  adminCreatePhrase,
  adminFetchPhraseAudio,
  adminListPhrases,
  adminListUsers,
  adminTranslatePhrase,
  adminTtsPhrase,
  adminUpdatePhrase,
  changePassword,
  fetchMe,
  updateProfile,
} from "./api";
import { useAuthedAction } from "./useAuthedAction";

export function useAuthedApi() {
  const runAuthed = useAuthedAction();

  return useMemo(
    () => ({
      fetchMe: () => runAuthed((token) => fetchMe(token)),
      updateProfile: (payload: { email: string; firstName?: string; lastName?: string }) =>
        runAuthed((token) => updateProfile(token, payload)),
      changePassword: (payload: { currentPassword: string; newPassword: string }) =>
        runAuthed((token) => changePassword(token, payload)),
      adminListUsers: () => runAuthed((token) => adminListUsers(token)),
      adminBlockUser: (userId: string, block: boolean) => runAuthed((token) => adminBlockUser(token, userId, block)),
      adminListPhrases: () => runAuthed((token) => adminListPhrases(token)),
      adminCreatePhrase: (payload: { textEn: string; textGe?: string; level?: string }) =>
        runAuthed((token) => adminCreatePhrase(token, payload)),
      adminTranslatePhrase: (id: string) => runAuthed((token) => adminTranslatePhrase(token, id)),
      adminTtsPhrase: (id: string, lang: "en" | "de" = "de") => runAuthed((token) => adminTtsPhrase(token, id, lang)),
      adminUpdatePhrase: (id: string, payload: { textEn?: string; textGe?: string; level?: string }) =>
        runAuthed((token) => adminUpdatePhrase(token, id, payload)),
      adminFetchPhraseAudio: (id: string, lang: "en" | "de" = "de") =>
        runAuthed((token) => adminFetchPhraseAudio(token, id, lang)),
    }),
    [runAuthed],
  );
}
