Tokenizers = function() { 


var for_kv = function(object, body) {
    for (var k in object) {
        if (object.hasOwnProperty(k)) {
            body(k, object[k]);
        }
    }
};

var escape_for_regexp = function(text) {
    return text.replace(/[\]\[\\^$*+?{}\.()|]/g, function(x) { return '\\' + x });
};

var $$ = {};

$$.regexp = function(tokens) { 
    return function(str) {
        var bestMatch = null;
        var bestFunc = null; 
        for_kv(tokens, function(k,v) {
            var m = new RegExp('^' + k).exec(str);
            if (m && (!bestMatch || m[0].length > bestMatch[0].length)) {
                bestMatch = m;
                bestFunc = v;
            }
        });

        // don't match the whole string in case we are in the middle of typing a token
        // we use \0 to mean "eof" so this will pass.
        if (bestFunc && bestMatch[0].length < str.length) {
            return [bestFunc(bestMatch), str.slice(bestMatch[0].length)];
        }
        else {
            return null;
        }
    }
};

$$.choice = function(tokenizers) {
    return function(str) {
        for (var i = 0; i < tokenizers.length; ++i) {
            var tokresult = tokenizers[i](str);
            if (tokresult) {
                return tokresult;
            }
        }
        return null;
    };
};

$$.string = function(str, func) {
    var d = {};
    d[escape_for_regexp(str)] = func;
    return $$.regexp(d);
};

$$.map = function(f, tokenizer) {
    return function(str) {
        var tokresult = tokenizer(str);
        if (tokresult) {
            return [f(tokresult[0]), tokresult[1]];
        }
        else {
            return null;
        }
    };
};

$$.prefix = function(tokenizers) {
    return function(str) {
        var ret = [];
        for (var i = 0; i < tokenizers.length; i++) {
            var tokresult = tokenizers[i](str); 
            if (tokresult) {
                ret.push(tokresult[0]);
                str = tokresult[1];
            }
            else {
                return [ ret, str ];
            }
        }
        return ret;
    };
};

$$.nonempty_choice = function(tokenizers) {
    if (tokenizers.length == 0) { return function(str) { return null } }
    if (tokenizers.length == 1) { return tokenizers[0] }
    
    return function(str) {
        for (var i = 0; i < tokenizers.length; i++) {
            var tokresult = tokenizers[i](str);
            if (tokresult && tokresult[1].length < str.length) {
                return tokresult;
            }
        }
        return null; // er.. if they *all* accept the empty string, then... er...
    };
};

return $$;

};
