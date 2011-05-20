// CodeCatalog Snippet http://www.codecatalog.net/279/1/
var foreach = function(array, body) {
    for (var i = 0; i < array.length; ++i) {
        body(array[i]);
    }
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/323/1/
var for_kv = function(object, body) {
    for (var i in object) {
        if (object.hasOwnProperty(i)) {
            body(i, object[i]);
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

var State = function(dotprod) {
    this.dotprod = dotprod;
    this.completed = [];
    this.predictFrom = [];
    this.scanFrom = [];

    this.add_predict = function(source) {
        this.predictFrom.push(source);
        return this;
    };
    this.add_scan = function(source, token) {
        this.scanFrom.push({ source: source, token: token });
        return this;
    };
    this.add_complete = function(source, value) {
        if ((this.dotprod.dot-1) in this.completed) {
            console.log("Completed from more than one place, not sure what to do");
        }
        this.completed[dotprod.dot-1] = value;
        return this;
    };

    this.scan = function(token) {
        if (this.dotprod.focus(token)) {
            return new State(this.dotprod.advance()).add_scan(this, token);
        }
        else {
            return null;
        }
    };

    this.toString = function() { 
        return this.dotprod.pretty();
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

    var add_state = function(dotprod) {
        if (dotprod in stateset) {
            var newstate = stateset[dotprod];
        }
        else {
            var newstate = new State(dotprod);
            queue.push(newstate);
            stateset[dotprod] = newstate;
        }
        return newstate;
    };

    var visit_state = function(state) {
        console.log("Visiting state " + state);
        var symbol = state.dotprod.focus;
        if (typeof(symbol) === 'string') {       // nonterminal: predict
            console.log("Predict");
            foreach(grammar[symbol], function(prod) {
                var dp = new DotProduction(prod, 0);
                add_state(dp).add_predict(state);
            });
        }
        else if (typeof(symbol) === 'function') { // terminal: scan
            console.log("Scan");
            scans.push(state);
        }
        else if (typeof(symbol) === 'undefined') { // end: complete
            console.log("Complete");
            var value = new Sexp(state.dotprod.prod.lhs, state.completed);
            foreach(state.predictFrom, function(pstate) {
                add_state(pstate.dotprod.advance()).add_complete(pstate, value);
            });
        }
        else {
            console.log("Unknown symbol type: " + symbol);
        }
    };

    foreach(initial_states, function(s) { queue.push(s) });

    while (queue.length > 0) { 
        var e = queue.pop();  // er, shift?
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

        console.log("-----------");
        this.stateset = make_state_set(grammar, consumes);
    };
};

var testgrammar = make_grammar({
    'E': [ [ 'top' ] ],
    'top': [ [ 'foo', 'foo' ] ],
    'foo': [ [ /^x/ ] ],
});

var sim = new Simulator(testgrammar, 'E');
sim.consume('x');
sim.consume('x');
