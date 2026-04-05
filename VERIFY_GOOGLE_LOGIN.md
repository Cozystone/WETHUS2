# Verify Google Login After Deploy

1. Deploy the current staged change containing `WETHUS2/vercel.json`
2. Open `https://wethus.co.kr/login.html`
3. Click the Google sign-in button
4. Confirm popup opens normally without `Cross-Origin-Opener-Policy policy would block the window.postMessage call`
5. Complete Google sign-in
6. Verify redirect proceeds normally instead of being blocked by popup communication
7. If login succeeds, confirm profile/session state is restored as expected
