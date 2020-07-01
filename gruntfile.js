module.exports = function (grunt) {
    // Build configuration.
    grunt.initConfig({
        // copy (ex: for fonts)
        copy: {
            fonts: {
                files: [{
                    expand: true,
                    cwd: 'node_modules/@fortawesome/fontawesome-free/webfonts', // 'Current Working Directory'
                    src: '**', // Read everything inside the cwd
                    dest: 'webfonts', // Destination folder
                    // flatten: true,
                    // filter: 'isFile'
                }],
            },
            maincss: {
                files: [{
                    expand: true,
                    cwd: 'node_modules/withfront/dist/css', // 'Current Working Directory'
                    src: '**', // Read everything inside the cwd
                    dest: 'css', // Destination folder
                    filter: 'isFile'
                }],
            },
            mainjs: {
                files: [{
                    expand: true,
                    cwd: 'node_modules/withfront/dist/js', // 'Current Working Directory'
                    src: '**', // Read everything inside the cwd
                    dest: 'js', // Destination folder
                    filter: 'isFile'
                }],
            },
            jqeury: {
                files: [{
                    expand: true,
                    cwd: 'node_modules/jquery/dist', // 'Current Working Directory'
                    src: '**', // Read everything inside the cwd
                    dest: 'dist', // Destination folder
                    filter: 'isFile'
                }],
            },
            datepicker: {
                files: [{
                    expand: true,
                    cwd: 'node_modules/bootstrap-datepicker/dist/locales', // 'Current Working Directory'
                    src: '**', // Read everything inside the cwd
                    dest: 'dist/locales', // Destination folder
                    filter: 'isFile'
                }],
            },
        },
    });


    grunt.loadNpmTasks('grunt-contrib-copy');

    // Default task(s).
    grunt.registerTask('default', [ 'copy' ]); //, 'purifycss', 'purifymin'
};
