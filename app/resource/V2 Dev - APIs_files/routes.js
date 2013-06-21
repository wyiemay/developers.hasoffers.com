/*
 * defines site routing
 *
 * For permission and preference based routing, provide an array of preferences and/or
 * a dictionary of preferences and the required value for that preference
 *
 * Example:
    permissions : ['stats', 'account_management'],
    preferences : {
      enable_google_analytic : false,
      offer_sort_dir         : 'desc'
    }
 */

(function(root, $, undefined) {
  'use strict';

  root.Routes = {
    '/performance' : {
      templateUrl       : 'partials/performance.html',
      controller        : 'Controllers.reports',
      mobileTemplateUrl : 'partials/mobile/performance.html',
     // mobileController  : root.Controllers.performanceMobile,
      bodyClass         : 'performance',
      pageTitle         : 'Performance Report',
      permissions       : ['stats']
    },

    '/performance/default' : {
      templateUrl : 'partials/performance.html',
      controller  : 'Controllers.reports',
      bodyClass   : 'performance',
      pageTitle   : 'Performance Report'
    },

    '/performanceDetail/:entity/:id' : {
      templateUrl : 'partials/performanceDetail.html',
      controller  : 'Controllers.reports',
      bodyClass   : 'performance',
      pageTitle   : 'Performance Detail Report',
      permissions : ['stats']
    },

    '/conversion' : {
      templateUrl       : 'partials/logs.html',
      mobileTemplateUrl : 'partials/mobile/logs.html',
      controller        : 'Controllers.reports',
      bodyClass         : 'performance',
      pageTitle         : 'Conversion Report',
      permissions       : ['stats']
    },

    '/conversion/default' : {
      templateUrl : 'partials/logs.html',
      controller  : 'Controllers.reports',
      bodyClass   : 'performance',
      pageTitle   : 'Conversion Report',
      permissions : ['stats']
    },

    '/referral' : {
      templateUrl : 'partials/reporting/referralReport.html',
      controller  : 'Controllers.referralReport',
      bodyClass   : 'referral',
      pageTitle   : 'Referral Report',
      permissions : ['stats']
    },

    '/offers' : {
      templateUrl       : 'js/application/offers/partials/offers.html',
      mobileTemplateUrl : 'js/application/offers/partials/offersMobile.html',
      controller        : 'Controllers.offers',
      bodyClass         : 'offers',
      pageTitle         : 'Offers',
      permissions       : ['offer_management']
    },

    '/offers/:context' : {
      templateUrl       : 'js/application/offers/partials/offers.html',
      mobileTemplateUrl : 'js/application/offers/partials/offersMobile.html',
      controller        : 'Controllers.offers',
      bodyClass         : 'offers',
      pageTitle         : 'My Offers',
      permissions       : ['offer_management']
    },

    '/offer/:offer_id' : {
      templateUrl       : 'js/application/offers/partials/offer-single.html',
      mobileTemplateUrl : 'js/application/offers/partials/offer-single.html',
      controller        : 'Controllers.offerDetail',
      pageTitle         : 'Offer Details',
      bodyClass         : 'offerDetails',
      permissions       : ['offer_management']
    },

    '/login' : {
      templateUrl : 'partials/login.html',
      controller  : 'Controllers.login',
      bodyClass   : 'login',
      pageTitle   : 'Login'
    },

    '/dashboard' : {
      templateUrl : 'js/application/dashboard/partials/dashboard.html',
      controller  : 'Controllers.dashboard',
      bodyClass   : 'dashboard',
      pageTitle   : 'Summary Report'
    },

    '/savedReports' : {
      templateUrl : 'partials/reporting/saved-reports.html',
      bodyClass   : 'savedPreports',
      controller  : 'Controllers.savedReports',
      pageTitle   : 'Saved Reports',
      permissions : ['stats']
    },

    '/savedReport/stats/:id' : {
      templateUrl : 'partials/performance.html',
      controller  : 'Controllers.reports',
      bodyClass   : 'performance',
      pageTitle   : 'Saved Performance Report',
      permissions : ['stats']
    },

    '/savedReport/conversions/:id' : {
      templateUrl : 'partials/logs.html',
      controller  : 'Controllers.reports',
      bodyClass   : 'performance',
      pageTitle   : 'Saved Conversion Report',
      permissions : ['stats']
    },

    '/messages' : {
      templateUrl       : 'partials/messages.html',
      mobileTemplateUrl : 'partials/messages.html',
      controller        : 'Controllers.messages',
      bodyClass         : 'messages',
      pageTitle         : 'Inbox'
    },

    '/message/:message_id' : {
      templateUrl : 'partials/message-single.html',
      controller  : 'Controllers.messages',
      bodyClass   : 'message',
      pageTitle   : 'Subject'
    },

    '/billing' : {
      templateUrl       : 'partials/billing.html',
      mobileTemplateUrl : 'partials/billing.html',
      controller        : 'Controllers.billing',
      bodyClass         : 'billing',
      pageTitle         : 'Billing',
      preferences       : {enable_affiliate_billing : true}
    },

    '/invoice/:id' : {
      templateUrl : 'partials/invoice.html',
      controller  : 'Controllers.invoice',
      bodyClass   : 'invoice',
      pageTitle   : 'Invoice',
      preferences : {enable_affiliate_billing: true}
    },

    '/receipt/:id' : {
      templateUrl : 'partials/receipt.html',
      controller  : 'Controllers.receipt',
      bodyClass   : 'receipt',
      pageTitle   : 'Payment',
      preferences : {
        enable_affiliate_billing       : true,
        disable_payment_reconciliation : false
      }
    },

    '/account' : {
      templateUrl       : 'partials/account.html',
      mobileTemplateUrl : 'partials/account.html',
      controller        : 'Controllers.account',
      bodyClass         : 'account',
      pageTitle         : 'My Account'
    },

    '/account/:id' : {
      templateUrl : 'partials/account.html',
      controller  : 'Controllers.account',
      bodyClass   : 'account',
      pageTitle   : 'View Account'
    },

    '/tools/pixels' : {
      templateUrl       : 'partials/tools/pixels/pixels.html',
      mobileTemplateUrl : 'partials/tools/pixels/pixels.html',
      controller        : 'Controllers.pixelPostback',
      pageTitle         : 'Pixels',
      bodyClass         : 'tools-pixels'
    },

    '/tools/adgroups' : {
      templateUrl       : 'js/application/adGroups/partials/adgroups.html',
      mobileController  : 'Controllers.adGroups',
      controller        : 'Controllers.adGroups',
      bodyClass         : 'adgroups',
      pageTitle         : 'Ad Groups'
    },

    '/tools/adgroups/:id' : {
      templateUrl : 'js/application/adGroups/partials/adgroup-single.html',
      controller  : 'Controllers.adGroupDetail',
      bodyClass   : 'adgroupdetails',
      pageTitle   : 'Ad Group Details'
    },

    '/tools/adgroup/create' : {
      templateUrl : 'js/application/adGroups/partials/adgroup-create.html',
      controller  : 'Controllers.adGroupForm',
      bodyClass   : 'createadgroup',
      pageTitle   : 'Create Ad Group'
    },

    '/tools/api-key' : {
      templateUrl       : 'js/application/apiKey/partials/apiKey.html',
      controller        : 'Controllers.apis',
      pageTitle         : 'APIs',
      bodyClass         : 'tools-apis'
    },

    '/page/:id' : {
      templateUrl : 'js/application/customPage/partials/template.html',
      controller  : 'Controllers.customPage',
      bodyClass   : 'custom-page',
      pageTitle   : '',
      permissions : []
    },

    '/terms' : {
      templateUrl : 'js/application/terms/partials/terms.html',
      controller  : 'Controllers.terms',
      bodyClass   : 'custom-page',
      pageTitle   : 'Terms of Service'
    }
  };
})(this, jQuery);
