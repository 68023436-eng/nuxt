export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  // ถ้ายังไม่ได้ login → redirect ไปหน้า /auth
  if (!user.value) {
    return navigateTo('/auth')
  }
})
