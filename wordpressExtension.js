new (function() {

    const WPAPI_HOST = 'public-api.wordpress.com';
    const WPAPI_PATH_PREFIX = '/wp/v2/sites/';
    const WPAPI_ENDPOINT = `https://${WPAPI_HOST}${WPAPI_PATH_PREFIX}`;    
    const STATUSCHECK_INTERVAL_IN_MS = 5000; 

    let https = require('https');

    var ext = this;
    ext.statusCode = -1;
    ext.blogname = "";

    // Cleanup function when the extension is unloaded
    ext._shutdown = function ()
    {
        if( ext.statusChecker ){
            clearInterval( ext.statusChecker );
        }
    };

    ext._checkBlogStatus = function ( callback ) {
        https.request( {
            hostname: WPAPI_HOST,
            port: 443,
            path: `${WPAPI_PATH_PREFIX}${ext.blogname}`,
            method: 'OPTIONS'
        }, (res) => {
            ext.statusCode = res.statusCode;
            if( callback ){
                callback( res.statusCode );
            } 
        }).end();
             
    }

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function ()
    {

        if( ext.blogname === "" ){
            return {status: 1, msg: 'Não estás ligado a nenhum blog.'}
        }

        if( ext.blogname != "" && ! ext.statusChecker ){
            ext.statusChecker = setInterval( ext._checkBlogStatus , STATUSCHECK_INTERVAL_IN_MS );
        } 

        switch( ext.statusCode ){
            case 200:
                return {status: 2, msg: `Ligado ao blog ${ext.blogname}`};
            case -1:
                return {status: 1, msg: `A ligar ao blog ${ext.blogname} ...` };
            default:
                return {status: 0, msg: `Blog ${ext.blogname} não encontrado!`};
        }
    };

    ext.getComments = function (callback)
    {
        https.get(`${WPAPI_ENDPOINT}${ext.blogname}/comments`, (res) => {
        var rawData = "";

        res.on('data', (d) => {    
            rawData = rawData + d;
        });

        res.on('end', () => { 
            try {
                let parsedData = JSON.parse( rawData ,'utf8');
                callback( parsedData.length );
            } catch (error) { console.log(e.message); callback(-1); }
        });

        }).on('error', (e) => {
            console.log(e);
            callback(-1);
        });
        
    };

    ext.connectBlog = function( blogname, callback ){
        ext.blogname = blogname + '.wordpress.com';
        ext._checkBlogStatus(callback);
    }

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            ['w', 'ligar ao blog %s .wordpress.com', 'connectBlog','NOME_DO_BLOG'],
            ['R', 'Número de comentários no blog', 'getComments']            
        ]
    };

    // Register the extension
    ScratchExtensions.register('Wordpress', descriptor, ext);
})();
