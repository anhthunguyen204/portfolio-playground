// Permanent asset files, keyed by image-zone id.
// Originals of the PayKit/Enfarm screenshots stay in assets/projects/; the site uses 2400px-wide WebP copies.
// To add or replace an image: put the file under assets/, point its id here, and add a matching
// <video data-pf-asset> line to the asset registry at the top of Portfolio.dc.html (the export
// only packages files referenced literally in markup, so the registry is what ships them).
window.PF_ASSETS = {
  "hero-avatar": "assets/images/site/hero-avatar.webp",
  "cover-enfarm": "assets/images/covers/enfarm.webp",
  "cover-sssmarket": "assets/images/covers/sssmarket.webp",
  "cover-paykit-onboarding": "assets/images/covers/paykit-onboarding.webp",
  "cover-doctranslate": "assets/images/covers/doctranslate.webp",
  "cover-bim": "assets/images/covers/bim.webp",
  "cover-paykit-payout": "assets/images/covers/paykit-payout.webp",
  "cover-paykit-payout-case": "assets/images/covers/paykit-payout.webp",
  "cover-paykit-onboarding-case": "assets/images/covers/paykit-onboarding.webp",
  "about-portrait": "assets/images/site/about-portrait.webp",
  "paykit-onboarding-s6-b1": "assets/images/case-studies/paykit-onboarding/s6-b1.webp",
  "paykit-onboarding-s0-b1": "assets/images/case-studies/paykit-onboarding/s0-b1.webp",
  "paykit-onboarding-s3-b1": "assets/images/case-studies/paykit-onboarding/s3-b1.webp",
  "cover-enfarm-case": "assets/images/covers/enfarm.webp",
  "cover-doctranslate-case": "assets/images/covers/doctranslate.webp",
  "doctranslate-s2-b3": "assets/images/case-studies/doctranslate/s2-b3.webp",
  "doctranslate-s2-b5": "assets/images/case-studies/doctranslate/s2-b5.webp",
  "doctranslate-s2-b7": "assets/images/case-studies/doctranslate/s2-b7.webp",
  "cover-bim-case": "assets/images/covers/bim.webp",
  "bim-s1-b1": "assets/images/case-studies/bim/s1-b1.webp",
  "bim-s2-b0-0": "assets/images/case-studies/bim/s2-b0-0.webp",
  "bim-s2-b0-1": "assets/images/case-studies/bim/s2-b0-1.webp",
  "bim-s3-b0": "assets/images/case-studies/bim/s3-b0.webp",
  "bim-s3-b1-0": "assets/images/case-studies/bim/s3-b1-0.webp",
  "bim-s3-b1-1": "assets/images/case-studies/bim/s3-b1-1.webp",
  "bim-s4-b1": "assets/images/case-studies/bim/s4-b1.webp",
  "bim-s3-b3": "assets/images/case-studies/bim/s3-b3.webp",
  "bim-s3-b4": "assets/images/case-studies/bim/s3-b4.webp",
  "paykit-onboarding-s4-b1": "assets/images/case-studies/paykit-onboarding/04-merchant-account-types.webp",
  "paykit-onboarding-s4-b3-0": "assets/images/case-studies/paykit-onboarding/05-form-non-linear.webp",
  "paykit-onboarding-s4-b5": "assets/images/case-studies/paykit-onboarding/07-form-ia.webp",
  "paykit-onboarding-s5-b3": "assets/images/case-studies/paykit-onboarding/10-activation-workflow.webp",
  "paykit-onboarding-s5-b4-0": "assets/images/case-studies/paykit-onboarding/11-prd-status.webp",
  "paykit-onboarding-s5-b4-1": "assets/images/case-studies/paykit-onboarding/12-prd-notification.webp",
  "paykit-onboarding-s5-b4-2": "assets/images/case-studies/paykit-onboarding/13-prd-activity-history.webp",
  "paykit-onboarding-s5-b6-0": "assets/images/case-studies/paykit-onboarding/14-app-request-form.webp",
  "paykit-onboarding-s5-b6-1": "assets/images/case-studies/paykit-onboarding/15-app-online-sales.webp",
  "paykit-onboarding-s5-b6-2": "assets/images/case-studies/paykit-onboarding/16-app-physical-store.webp",
  "paykit-onboarding-s5-b6-3": "assets/images/case-studies/paykit-onboarding/17-app-sample-invoice.webp",
  "paykit-onboarding-s5-b7": "assets/images/case-studies/paykit-onboarding/18-op-request-list.webp",
  "paykit-onboarding-s5-b8": "assets/images/case-studies/paykit-onboarding/20-op-request-detail.webp",
  "paykit-payout-s2-b2-0": "assets/images/case-studies/paykit-payout/03-flow-add.webp",
  "paykit-payout-s2-b2-1": "assets/images/case-studies/paykit-payout/04-flow-change-default.webp",
  "paykit-payout-s2-b2-2": "assets/images/case-studies/paykit-payout/05-flow-delete.webp",
  "paykit-payout-s2-b3-0": "assets/images/case-studies/paykit-payout/06-flow-approve-deny.webp",
  "paykit-payout-s2-b3-1": "assets/images/case-studies/paykit-payout/07-flow-lock.webp",
  "paykit-payout-s3-b1": "assets/images/case-studies/paykit-payout/08-app-add-account.webp",
  "paykit-payout-s3-b3": "assets/images/case-studies/paykit-payout/09-app-change-default.webp",
  "paykit-payout-s4-b1": "assets/images/case-studies/paykit-payout/13-op-list.webp",
  "paykit-payout-s5-b2": "assets/images/case-studies/paykit-payout/18-uat-test-cases.webp",
  "enfarm-s0-b1": "assets/images/case-studies/enfarm/02-press-vnexpress.webp",
  "enfarm-s5-b1": "assets/images/case-studies/enfarm/10-app-screens.webp",
  "cover-sssmarket-case": "assets/images/covers/sssmarket.webp"
};
window.PF_RESUME = 'assets/resume/Thu-Nguyen-Resume.pdf';
// Resolves a project path to its loadable URL: the packaged copy in an exported build, the file itself elsewhere.
window.pfAsset = function (path) {
  if (!path) return '';
  var el = document.querySelector('[data-pf-asset="' + path + '"]');
  return (el && el.getAttribute('src')) || path;
};
window.pfAssetReady = function () { return !!document.querySelector('[data-pf-assets]'); };
