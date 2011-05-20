// CodeCatalog Snippet http://www.codecatalog.net/279/1/
var foreach = function(array, body) {
    for (var i = 0; i < array.length; ++i) {
        body(array[i]);
    }
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/323/2/
var for_kv = function(object, body) {
    for (var k in object) {
        if (object.hasOwnProperty(k)) {
            body(k, object[k]);
        }
    }
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/321/1/
var unique_id = function() {
    var id = 0;
    return function() { return id++ };
}();
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/186/1/
var maximum_by = function(measure, xs) {
    var max_x = xs[0];
    var max_measure = measure(max_x);
    for (var i = 1; i < xs.length; i++) {
        var m = measure(xs[i]);
        if (m > max_measure) {
            max_x = xs[i];
            max_measure = m;
        }
    }
    return max_x;
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/32/2/
var max = function() {
    var r = arguments[0];
    for (var i = 1; i < arguments.length; ++i) {
        if (arguments[i] > r) r = arguments[i];
    }
    return r;
};
// End CodeCatalog Snippet


// A grammar is a hash of LoLs.  Each key is a nonterminal, and each value is
// a disjunction of juxtapositions of symbols.  A symbol can be:
//
// * A string, indicating a nonterminal
// * A function, indicating a terminal (returns the value of the nonterminal parse, or 'null').

var Production = function(lhs, rhss) {
    this.lhs = lhs;
    this.rhss = rhss;
    this.id = unique_id();
};

var DotProduction = function(prod, dot) {
    this.prod = prod;
    this.dot = dot;

    this.toString = function() { return prod.id + ' ' + dot };
    this.focus = prod.rhss[dot];
    this.advance = function() { return new DotProduction(prod, dot+1) };
    this.pretty = function() { return prod.lhs + " ::= " + prod.rhss.slice(0,dot).join(' ') + " * " + prod.rhss.slice(dot).join(' ') };
};

var State = function(dotprod, predictFrom) {
    this.dotprod = dotprod;
    this.completed = [];
    this.predictFrom = predictFrom || [];

    this.toString = function() { 
        return this.dotprod.pretty();
    };

    this.scan = function(token) {
        if (this.dotprod.focus(token)) {
            return this.advance(token);
        }
        else {
            return null;
        }
    };

    this.advance = function(value) {
        var newstate = new State(this.dotprod.advance());
        newstate.completed = this.completed.slice(0);
        newstate.completed[newstate.dotprod.dot-1] = value;
        newstate.predictFrom = this.predictFrom;
        return newstate;
    };

    this.nom = function(other_state) {
        var self = this;  // ugh javascript
        foreach(other_state.predictFrom, function(s) { self.predictFrom.push(s) }); // XXX can there be overlap?
        var maxix = max(this.completed.length, other_state.completed.length);
        for (var i = 0; i < maxix; i++) {
            // TODO what if they are both defined and disagree?
            this.completed[i] = i in this.completed ? this.completed[i] : other_state.completed[i];
        }
    };
};

var Sexp = function(head, args) {
    this.head = head;
    this.args = args;
};

// target : DotProduction
// action : State -> Action
var Transition = function(target, action) {
    this.target = target;
    this.action = action;
};

var make_state_set = function(grammar, initial_states) {
    var stateset = {};
    var scans = [];
    var queue = [];

    var add_state = function(state) {
        if (state.dotprod in stateset) {
            var newstate = stateset[state.dotprod].nom(state);
        }
        else {
            queue.push(state);
            stateset[state.dotprod] = state;
        }
    };

    var visit_state = function(state) {
        console.log(state.toString());
        var symbol = state.dotprod.focus;
        if (typeof(symbol) === 'string') {       // nonterminal: predict
            foreach(grammar[symbol], function(prod) {
                var dp = new DotProduction(prod, 0);
                add_state(new State(dp, [state]));
            });
        }
        else if (typeof(symbol) === 'function') { // terminal: scan
            scans.push(state);
        }
        else if (typeof(symbol) === 'undefined') { // end: complete
            var value = new Sexp(state.dotprod.prod.lhs, state.completed);
            foreach(state.predictFrom, function(pstate) {
                add_state(pstate.advance());
            });
        }
        else {
            console.log("Unknown symbol type: " + symbol);
        }
    };

    foreach(initial_states, add_state);

    while (queue.length > 0) { 
        var e = queue.splice(0,1)[0];  // remove from beginning
        visit_state(e);
    }

    return scans;
};


var make_grammar = function(grammarlol) {
    var grammar = {};
    for_kv(grammarlol, function(k,lol) {
        grammar[k] = [];
        foreach(lol, function(l) {
            grammar[k].push(new Production(k, l));
        });
    });
    return grammar;
};

var Simulator = function(grammar, startsym) {
    this.stateset = make_state_set(grammar, [new State(new DotProduction(grammar[startsym][0], 0))]);

    this.consume = function(str) {
        var consumes = [];
        foreach(this.stateset, function(state) {
            var match = state.scan(str);
            if (match) {
                consumes.push(match);
            }
        });
    
        if (consumes.length == 0) { throw "No input could be consumed" }

        console.log("-----------");
        this.stateset = make_state_set(grammar, consumes);
    };
};

var testgrammar = make_grammar({
    'E': [ [ 'eplus' ] ],
    'eplus': [ [ 'etimes' ], [ 'eplus', /^\+/, 'etimes' ] ], 
    'etimes': [ [ 'eatom' ], [ 'etimes', /^\*/, 'eatom' ] ],
    'eatom': [ [ /^\d+/ ], [ /^\(/, 'eplus', /^\)/ ] ],
});

var sim = new Simulator(testgrammar, 'E');
sim.consume('1');
sim.consume('*');
sim.consume('2');
sim.consume('+');
sim.consume('3');
