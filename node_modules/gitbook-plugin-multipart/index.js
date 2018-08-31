var cheerio = require('cheerio');

module.exports = {
    book: {
        assets: "assets",
        css: [ "multipart.css" ]
    },
    hooks: {
        // Gets plain text content
        "summary:before": function(summary) {

            // If the file contains an h2, we need to reformat it
            if (summary.content.match(/^## /m)) {

                var parts = summary.content.split(/(?=##)/);
                for (var i = 0; i < parts.length; i++) {
                    // Remove any blank lines
                    parts[i] = parts[i].replace(/(\*.*)\n\n/gm, "$1\n");

                    // If the part has a heading, replace it and indent the child items in the list
                    // Mark a heading as a part by smuggling some text into the list item.
                    // Messy, but it's the only way.
                    if (parts[i].indexOf('##') == 0) {
                        parts[i] = parts[i].replace(/^([ \t]*\* .+)$/gm, "    $1")
                            .replace(/^## (.*)$/gm, "* -XPARTX-$1")
                    }
                }
                summary.content = parts.join('');
            }

            return summary;
        },

        // Requires an unhealthy knowledge of the generated template...
        "page:after": function(page) {

            var $ = cheerio.load(page.content);

            // Replace top level li.chapter with li.part
            $('ul.summary > li.chapter').each(function(i, elem) {
                var li = $(elem);

                // Replace the classes if the chapter is actually a part, and add a divider
                if (li.text().indexOf('-XPARTX-') > 0) {
                    li.removeClass('chapter');
                    li.addClass('part');

                    // Don't add a divider before the first part, let it come straight after the Introduction page
                    if (i > 1)
                        li.before('<li class="part divider" />');
                }
            });

            // remove chapter numbers from any intro pages (and child pages)
            $('ul.summary > li.chapter span > b').remove();
            $('ul.summary > li.chapter a > b').remove();

            // Remove the chapter number from the part header
            $('ul.summary > li.part > span > b').remove();
            $('ul.summary > li.part > a > b').remove();

            // Replace the nasty munging of the name for part heading
            $('ul.summary > li.part > span').each(function(i, elem) {
                var span = $(elem);
                span.text(span.text().replace(/-XPARTX-/, ""));
            });

            // Bump the remaining chapter numbers so each chapter is only unique
            // within the part
            $('ul.summary > li.part li.chapter b').each(function(i, elem) {
                var b = $(elem);
                var text = b.text();
                var index = text.indexOf('.');
                if (index > -1)
                    b.text(text.substring(index + 1));
            });

            page.content = $.html();
            return page;
        }
    }
};
