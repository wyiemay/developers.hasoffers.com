
(function(root, $, undefined) {
    'use strict';

    root.Config = {"api_endpoint":"http:\/\/api.v2.hasoffers.com\/v3\/","api_network_id":"v2","debug":"3","session_token":"djI6YWZmaWxpYXRlX3VzZXI6MTg0OjE6YWM4YjhmYzY3MDM1MzI4ZjUzODY5ODZjMTU2MmZhZmNlZTQyYzlkMmU3OTNjNmM3YzYyMDA2ZGYyNTVhZjdiMg==","affiliate_id":"1174","affiliate_user_id":"184","internal_auth":false,"network_name":"V2 Dev","network_logo":"<h1>V2 Dev<\/h1>","proxy_url":"http:\/\/dh-jack01-dev.sea1.office.priv:8080\/store\/","sessionTokenUrl":"http:\/\/use-api-external1-a.hasservers.com\/Api\/jsonp?InternalToken=XqB6J0votAzse9s&Target=Internal_Authentication&Method=getAffiliateSessionToken","fallbackApiUrl":"http:\/\/use-api-external1-a.hasservers.com\/v3\/"};

    if(root.Config.network_logo) {
        var rawLogo = $(root.Config.network_logo);

        // Session returns an html image tag or an H1 with the network name. We should ignore non images.
        if(!rawLogo.is('a')) {
            root.Config.network_logo = false;
        } else {
            root.Config.network_logo = rawLogo.find('img').first().attr('src');
        }
    }

    //TODO:  This should be removed safely. It doesn't seem to be used anywhere, but testing coverage is sparse.
    root.Config.Enums = {
        'currencyFields' : [
            'Stat.payout',
            'Stat.sale_amount'
        ],
        'conversionStatus' : {
          'approved' : 'Approved',
          'pending'  : 'Pending',
          'rejected' : 'Rejected',
          'active'   : 'Active'
        },
        'offerPayoutType' : {
          'cpa_flat'       : 'CPA',
          'cpa_percentage' : 'CPS',
          'cpa_both'       : 'CPA + CPS',
          'cpc'            : 'CPC',
          'cpm'            : 'CPM'
        },
        'offerPixelType' : {
          'code' : 'HTML / JavaScript Code',
          'image' : 'Image Pixel',
          'url' : 'Postback URL'
        }
    };

})(this, jQuery);
