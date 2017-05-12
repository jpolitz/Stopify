import {NodePath, VisitNode, Visitor} from 'babel-traverse';
import * as t from 'babel-types';

type Visited<T> = T & {
  visited?: boolean;
};

function visited(n: Visited<t.Node>): Visited<t.Node> {
    n.visited = true;
    return n;
}

const tagFree: Visitor = {
  Identifier: function (path: NodePath<Visited<t.Identifier>>): void {
    if (path.node.visited) {
     return;
    }
    if (!path.scope.hasBinding(path.node.name) &&
        !path.scope.hasOwnBinding(path.node.name)) {
      const freeProp = visited(t.identifier('$isFree'));
      path.node.visited = true;
      const assign = t.assignmentExpression('=',
        <t.Identifier>visited(t.memberExpression(path.node, <t.Identifier>freeProp)),
        t.booleanLiteral(true))
      path.getStatementParent().insertBefore(t.expressionStatement(assign));
    }
  },
  MemberExpression: {
    enter(path: NodePath<Visited<t.MemberExpression>>): void {
      if (path.node.visited) {
        return;
      }
      if (t.isIdentifier(path.node.property)) {
        if (!path.scope.hasBinding(path.node.property.name) &&
            !path.scope.hasOwnBinding(path.node.property.name)) {
          const freeProp = visited(t.identifier('$isFree'));
          path.node.visited = true;
          const assign = t.assignmentExpression('=',
            <t.Identifier>visited(t.memberExpression(path.node, <t.Identifier>freeProp)),
            t.booleanLiteral(true))
          path.getStatementParent().insertBefore(t.expressionStatement(assign));
        }
      }
    }
  },
  LVal: {
    enter(path: NodePath<t.LVal>): void {
      path.skip();
    }
  }
};

module.exports = function() {
  return { visitor: tagFree };
};