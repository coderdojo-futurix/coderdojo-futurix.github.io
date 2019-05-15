

new (function() {
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
            hostname: 'public-api.wordpress.com',
            port: 443,
            path: `/wp/v2/sites/${ext.blogname}`,
            method: 'OPTIONS'
        }, (res) => {
            if( callback ){
                callback( res.statusCode);
            } else {
                ext.statusCode = res.statusCode;
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
            return {status: 1, msg: `A ligar ao blog ${ext.blogname} ...` }
        } 

        //return {status: 2, msg: 'Ready'};


        switch( ext.statusCode ){
            case 200:
                return {status: 2, msg: `Ligado ao blog ${ext.blogname}`};
            default:
                return {status: 0, msg: `Blog ${ext.blogname} não encontrado!`};

        }
    };

    ext.getCommentsSync = function (blogname)
    {
        return 0;
    };

    ext.getComments = function (callback)
    {
        //process.write("Running ext.getComments().... for site: " + blogname);
        console.log("Running ext.getComments()....");

        
        //ext.blogname = encodeURIComponent(blogname + "wordpress.com");
        https.get(`https://public-api.wordpress.com/wp/v2/sites/${ext.blogname}.wordpress.com/comments`, (res) => {
        var rawData = "";

        res.on('data', (d) => {    
            rawData = rawData + d;
        });

        res.on('end', () => { 
            try {
                let parsedData = JSON.parse( rawData ,'utf8');
                console.log(parsedData);
                callback( parsedData.length );
            } catch (error) { console.log(e.message); callback(-1); }
        });

        }).on('error', (e) => {
            console.log(e);
            callback(-1);
        });
        
    };

    ext.connectBlog = function( blogname, callback ){
        ext.blogname = encodeURIComponent( blogname + '.wordpress.com');
        ext._checkBlogStatus(callback);
    }

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
/*
            [' ', 'set pixel %n , %n to R %n G %n B %n', 'set_pixel', '0', '0', '255', '255', '255'],
            [' ', 'set pixel %n , %n to %m.colour', 'set_pixel_col', '0', '0', 'white'],
            [' ', 'set all pixels to R %n G %n B %n', 'set_all_pixels', '255', '255', '255'],
            [' ', 'set all pixels to %m.colour', 'set_all_pixels_col', 'white'],
            [' ', 'show letter %s at rotation %m.rotation in colour %m.colour background %m.colour', 'show_letter', 'A', '0', 'white', 'off'],
            [' ', 'scroll message %s at rotation %m.rotation in colour %m.colour background %m.colour', 'scroll_message', 'Hello!', '0', 'white', 'off'],
            ['r', 'roll', 'get_ox'],
            ['r', 'pitch', 'get_oy'],
            ['r', 'yaw', 'get_oz'],
            ['r', 'temperature', 'get_t'],
            ['r', 'pressure', 'get_p'],
            ['r', 'humidity', 'get_h'],
*/          
            ['w', 'ligar ao blog  %s.wordpress.com', 'connectBlog','NOME_DO_BLOG'],
            ['r', '# de comentários no blog', 'getCommentsSync'], 
            ['R', 'Número de comentários no blog', 'getComments']            
        ]
        
  /*      ,
        menus: {
            colour: ['off', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white'],
            direction: ['up', 'down', 'left', 'right'],
            rotation : ['0', '90', '180', '270'],
              }
        */
    };

    // Register the extension
    ScratchExtensions.register('Wordpress', descriptor, ext);
})();
