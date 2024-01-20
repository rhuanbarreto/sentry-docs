import React from 'react';

import {sortPages} from 'sentry-docs/utils';

import {SidebarLink} from './sidebarLink';
import {SmartLink} from './smartLink';
import {serverContext} from 'sentry-docs/serverContext';

type Node = {
  [key: string]: any;
  context: {
    [key: string]: any;
    sidebar_order?: number | null;
    sidebar_title?: string | null;
    title?: string | null;
  };
  path: string;
};

type Entity<T> = {
  children: T[];
  name: string;
  node: Node | null;
};

export interface EntityTree extends Entity<EntityTree> {}

export const toTree = (nodeList: Node[]): EntityTree[] => {
  const result: EntityTree[] = [];
  const level = {result};

  nodeList
    .sort((a, b) => a.path.localeCompare(b.path))
    .forEach(node => {
      let curPath = '';
      node.path.split('/').reduce((r, name: string) => {
        curPath += `${name}/`;
        if (!r[name]) {
          r[name] = {result: []};
          r.result.push({
            name,
            children: r[name].result,
            node: curPath === node.path ? node : null,
          });
        }

        return r[name];
      }, level);
    });

  result.length; // result[0] is undefined without this. wat
  return result[0].children;
};

export const renderChildren = (
  children: EntityTree[],
  exclude: string[],
  path: string,
  showDepth: number = 0,
  depth: number = 0
): React.ReactNode[] => {
  return sortPages(
    children.filter(
      ({name, node}) =>
        node && !!node.context.title && name !== '' && exclude.indexOf(node.path) === -1
    ),
    ({node}) => node
  ).map(({node, children: nodeChildren}) => {
    return (
      <SidebarLink
        to={node.path}
        key={node.path}
        title={node.context.sidebar_title || node.context.title}
        collapsed={depth >= showDepth}
        path={path}
      >
        {renderChildren(nodeChildren, exclude, path, showDepth, depth + 1)}
      </SidebarLink>
    );
  });
};

type ChildrenProps = {
  tree: EntityTree[];
  exclude?: string[];
  showDepth?: number;
  path: string;
};

export function Children({tree, path, exclude = [], showDepth = 0}: ChildrenProps) {
  return (
    <React.Fragment>{renderChildren(tree, exclude, path, showDepth)}</React.Fragment>
  );
}

type Props = {
  root: string;
  tree: EntityTree[];
  collapse?: boolean;
  exclude?: string[];
  noHeadingLink?: boolean;
  prependLinks?: [string, string][];
  showDepth?: number;
  suppressMissing?: boolean;
  title?: string;
};

export function DynamicNav({
  root,
  title,
  tree,
  collapse = false,
  exclude = [],
  showDepth = 0,
  prependLinks = [],
  suppressMissing = false,
  noHeadingLink = false,
}: Props) {
  if (root.startsWith('/')) {
    root = root.substring(1);
  }

  let entity: EntityTree | undefined;
  let currentTree = tree;
  const rootBits = root.split('/');
  rootBits.forEach(bit => {
    entity = currentTree.find(n => n.name === bit);
    if (!entity) {
      if (!suppressMissing) {
        // eslint-disable-next-line no-console
        console.warn(`Could not find entity at ${root} (specifically at ${bit})`);
      }
      return;
    }
    currentTree = entity.children;
  });
  if (!entity) {
    return null;
  }
  if (!title && entity.node) {
    title = entity.node.context.sidebar_title || entity.node.context.title || '';
  }
  const parentNode = entity.children
    ? entity.children.find((n: EntityTree) => n.name === '')
    : null;

  const {path} = serverContext();
  const isActive = path.join('/').indexOf(root) === 0;
  const linkPath = `/${path.join('/')}/`;

  const headerClassName = 'sidebar-title d-flex align-items-center';
  const header =
    parentNode && !noHeadingLink ? (
      <SmartLink
        to={`/${root}/`}
        className={headerClassName}
        activeClassName="active"
        data-sidebar-link
      >
        <h6>{title}</h6>
      </SmartLink>
    ) : (
      <div className={headerClassName} data-sidebar-link>
        <h6>{title}</h6>
      </div>
    );

  return (
    <li className="mb-3" data-sidebar-branch>
      {header}
      {(!collapse || isActive) && entity.children && (
        <ul className="list-unstyled" data-sidebar-tree>
          {prependLinks &&
            prependLinks.map(link => (
              <SidebarLink to={link[0]} key={link[0]} title={link[1]} path={linkPath} />
            ))}
          <Children
            tree={entity.children}
            exclude={exclude}
            showDepth={showDepth}
            path={linkPath}
          />
        </ul>
      )}
    </li>
  );
}
