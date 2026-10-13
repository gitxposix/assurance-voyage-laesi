// Identity email links may land on the home page. Preserve the callback for admin.
if (/(?:^#|&)(?:invite_token|recovery_token|confirmation_token|access_token)=/.test(location.hash)) {
  location.replace('/admin/' + location.hash);
}
