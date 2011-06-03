var floating_point_regexp = /[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/;

// CodeCatalog Snippet http://www.codecatalog.net/357/3/
var escape_for_regexp = function(text) {
    return text.replace(/[\]\[\\^$*+?{}\.()|]/g, function(x) { return '\\' + x });
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/361/1/
var reduce_args_left = function(f) {
    return function() {
        var r = arguments[0];
        for (var i = 1; i < arguments.length; i++) {
            r = f(r, arguments[i]);
        }
        return r;
    };
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/325/1/
var repeat_string = function(string, times) {
    var r = "";
    for (var i = 0; i < times; i++) {
        r += string;
    }
    return r;
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/359/1/
var trace = function() {
    console.log.apply(console, arguments);
    return arguments[arguments.length-1];
};
// End CodeCatalog Snippet

var Token = {
    init_env: function() { return { indent: 0 } },

    rx: function(rx) {
        return {
            // pattern is a *string* containing the unanchored source of a regular expression
            pattern: rx.source,
            // groups is the number of capture groups in this regular expression
            groups: 0,
            // text takes three arguments:
            //    m: the regexp result match
            //    offs: the number of match groups before rx appears in the final regex
            //    env: an arbitrary environment to be passed along (for state)
            text: function(m,offs,env) { return m[offs] },
        }
    },
    
    string: function(text) {
        return this.rx(new RegExp(escape_for_regexp(text)));
    },
    
    cat: reduce_args_left(function(t,u) {
        return {
            pattern: '(' + t.pattern + ')' + '(' + u.pattern + ')',
            groups: t.groups + u.groups + 2,
            text: function(m,offs,env) { 
                return t.text(m, offs + 1, env) + u.text(m, offs + 1 + t.groups + 1, env);
            }
        }
    }),

    // parses a token possibly surrounded by whitespace.  the whitespace will be removed
    tok: function(t) {
        return {
            pattern: '\\s*(' + t.pattern + ')\\s*',
            groups: 1,
            text: function(m,offs,env) { return t.text(m, offs+1, env) }
        }
    },

    space: {
        pattern: '\\s*',
        groups: 0,
        text: function(m,offs,env) { return ' ' }
    },
    nospace: {
        pattern: '\\s*',
        groups: 0,
        text: function(m,offs,env) { return '' }
    },
    newline: {
        pattern: '\\s*',
        groups: 0,
        text: function(m,offs,env) { return '\n' + repeat_string(' ', env.indent) }
    },
    indent: {
        pattern: '',
        groups: 0,
        text: function(m,offs,env) {
            env.indent += 4;
            return '';
        }
    },
    unindent: {
        pattern: '',
        groups: 0,
        text: function(m,offs,env) {
            env.indent -= 4;
            return '';
        }
    },

    space_after: function(t) {
        return this.cat(this.string(t), this.space);
    },
    
	no_space_after_rx: function(rx) {
        return this.cat(this.rx(rx), this.nospace);
	},
    
	no_space_before_rx: function(rx) {
        return this.cat(this.nospace, this.rx(rx));
	},
    
    space_padded_rx: function(rx) {
        return this.cat(this.space, this.rx(rx), this.space);
    },

	newline_after: function(text) {
        return this.cat(this.string(text), this.newline);
	},
};

var javascript_grammar = {
    program: [ [ 'stmts' ] ],

    stmts: [ [ ], 
             [ 'stmt', 'more_stmts' ] ],

    more_stmts: [ [ ], 
                [ Token.newline_after(';'), 'stmts' ] ],

    stmt: [ [ 'var_decl' ],
            [ 'expr' ],
            [ 'block' ],
            [ 'return_stmt' ],
            [ 'void_stmt' ],
            [ 'for_stmt' ],
            [ 'foreach_stmt' ],
            [ 'if_stmt' ],
            [ 'function_stmt' ] ],

    return_stmt: [ [ 'return_keyword', 'expr' ] ],
    void_stmt: [ [ 'void_keyword', 'expr' ] ],

    function_stmt: [ [ 'function_keyword', 'identifier', Token.string('('), 'arg_list', Token.string(')'), 'block' ] ],

    // TODO what is the syntactic class of the first clause?
    for_stmt: [ [ 'for_keyword', Token.string('('), 'stmt', Token.string(')'), 'expr', Token.string(';'), 'expr', Token.string(')'), 'stmt' ] ],
    foreach_stmt: [ [ 'for_keyword', Token.string('('), 'foreach_var_decl', Token.rx(/\s+/), 'in_keyword', 'expr', Token.string(')'), 'stmt' ] ],
    if_stmt: [ [ 'if_keyword', Token.string('('), 'expr', Token.string(')'), 'stmt', 'else_clause' ] ],
    else_clause: [ [ ], [ 'else_keyword', 'stmt' ] ],

    foreach_var_decl: [ [ 'var_keyword', 'identifier' ],
                        [ 'identifier' ] ],
    
    var_decl: [ [ 'var_keyword', 'initializer_list' ] ],

    initializer_list: [ [ 'initializer' ],
                        [ 'initializer_list', Token.space_after(','), 'initializer' ] ],

    initializer: [ [ 'identifier', Token.space_padded_rx(/=/), 'expr' ] ],

    identifier: [ [ Token.rx(/[a-zA-Z_$][\w$]*/) ] ],

    expr: [ [ 'assignment_expr' ] ],
    
    assignment_expr: [ [ 'operator_expr' ],
                       [ 'operator_expr', 'assignment_operator', 'assignment_expr' ] ],

    assignment_operator: [ [ Token.space_padded_rx(/[+*\/%-]?=/) ] ],

    // not modeling all precedence levels
    operator_expr: [ [ 'unary_expr' ],
                     [ 'unary_expr', 'operator', 'operator_expr' ] ],

    operator: [ [ Token.space_padded_rx(/(?:\+|-|\*|\/|%|==|!=|>|>=|<|<=|===|!==|\|\||&&|in)/) ] ],

    unary_expr: [ [ 'atomic_expr' ],
                  [ 'prefix_operator', 'unary_expr' ] ],

    prefix_operator: [ [ Token.no_space_after_rx(/(?:\+\+|--|\+|-|!)/) ] ],
    postfix_operator: [ [ Token.no_space_before_rx(/(?:\+\+|--)/) ] ],

    atomic_expr: [ [ 'literal' ],
                   [ 'function_expr' ],
                   [ 'array_expr' ],
                   [ 'object_expr' ],
                   [ 'index_expr' ],
                   [ 'funcall_expr' ],
                   [ 'variable' ],
                   [ Token.string('('), 'expr', Token.string(')') ] ],

    literal: [ [ Token.rx(floating_point_regexp) ],
               [ Token.string('"'), 'dq_string', Token.string('"') ],
               [ Token.string("'"), 'sq_string', Token.string("'") ],
               [ Token.string('/'), 'slash_string', Token.string('/') ] ],

    dq_string: [ [ Token.rx(/^[^"\\]*(?:\\.[^"\\]*)*/) ] ],
    sq_string: [ [ Token.rx(/^[^'\\]*(?:\\.[^'\\]*)*/) ] ],
    slash_string: [ [ Token.rx(/^[^\/\\]*(?:\\.[^\/\\]*)*/) ] ],
    
    function_expr: [ [ 'function_keyword', Token.string('('), 'arg_list', Token.string(')'), 'block' ] ],
    arg_list: [ [ ], [ 'identifier', 'more_arg_list' ] ],
    more_arg_list: [ [ ], [ Token.space_after(','), 'identifier', 'more_arg_list' ] ],

    block: [ [ Token.cat(Token.string('{'), Token.indent, Token.newline), 'stmts', Token.cat(Token.unindent, Token.string('}')) ] ],

    array_expr: [ [ Token.string('['), 'expr_list', Token.string(']') ] ],
    
    expr_list: [ [ ], [ 'expr', 'more_expr_list' ] ],
    more_expr_list: [ [ ], [ Token.space_after(','), 'expr', 'more_expr_list' ] ],

    object_expr: [ [ Token.string('{'), 'property_list', Token.string('}') ] ],

    property_list: [ [ ], [ 'property_kv', 'more_property_list' ] ],
    more_property_list: [ [ ], [ Token.string(','), 'property_kv', 'more_property_list' ] ],

    property_kv: [ [ 'property_key', Token.string(':'), 'expr' ] ],

    property_key: [ [ 'identifier' ],
                    [ 'literal' ] ],   // not exactly right.  eg. regexes can't be keys

    index_expr: [ [ 'atomic_expr', Token.string('['), 'expr', Token.string(']') ],
                  [ 'atomic_expr', Token.string('.'), 'identifier' ] ],

    funcall_expr: [ [ 'atomic_expr', Token.string('('), 'expr_list', Token.string(')') ] ],

    variable: [ [ 'identifier' ] ],

    var_keyword: [ [ Token.space_after('var') ] ],
    function_keyword: [ [ Token.space_after('function') ] ],
    return_keyword: [ [ Token.space_after('return') ] ],
    void_keyword: [ [ Token.space_after('void') ] ],
    for_keyword: [ [ Token.space_after('for') ] ],
    in_keyword: [ [ Token.space_after('in') ] ],
    if_keyword: [ [ Token.space_after('if') ] ],
    else_keyword: [ [ Token.space_after('else') ] ],
};
