// ملف جذر التطبيق
import { Redirect } from "expo-router";

export default function Root() {
  // توجيه المستخدم لصفحة تسجيل الدخول بشكل افتراضي
  return <Redirect href="/auth/login" />;
} 