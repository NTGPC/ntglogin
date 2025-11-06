"""
Workflow executor - parses React Flow graph and executes actions using Playwright.
"""
from typing import Dict, Any, List
from playwright.sync_api import Page


def topological_sort(nodes: List[Dict], edges: List[Dict]) -> List[Dict]:
    """Sort nodes topologically based on edges."""
    if not nodes:
        return []
    
    # Build adjacency list
    incoming = {n['id']: [] for n in nodes}
    outgoing = {n['id']: [] for n in nodes}
    
    for edge in edges:
        source = edge.get('source')
        target = edge.get('target')
        if source and target and source in incoming and target in incoming:
            outgoing[source].append(target)
            incoming[target].append(source)
    
    # Find start nodes (no incoming edges)
    queue = [n['id'] for n in nodes if not incoming[n['id']]]
    result = []
    visited = set()
    
    while queue:
        node_id = queue.pop(0)
        if node_id in visited:
            continue
        visited.add(node_id)
        
        # Find node data
        node_data = next((n for n in nodes if n['id'] == node_id), None)
        if node_data:
            result.append(node_data)
        
        # Add children to queue
        for child_id in outgoing[node_id]:
            if all(parent in visited for parent in incoming[child_id]):
                queue.append(child_id)
    
    # Add any remaining nodes (orphaned)
    for node in nodes:
        if node['id'] not in visited:
            result.append(node)
    
    return result


def execute_workflow(page: Page, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute a workflow using Playwright page.
    Args:
        page: Playwright Page instance
        workflow_data: React Flow graph {nodes, edges, version}
    Returns:
        dict with results and any errors
    """
    nodes = workflow_data.get('nodes', [])
    edges = workflow_data.get('edges', [])
    
    if not nodes:
        return {"success": False, "error": "No nodes in workflow"}
    
    # Build adjacency for merge node handling
    in_edges: Dict[str, List[str]] = {n['id']: [] for n in nodes}
    for edge in edges:
        in_edges.get(edge['target'], []).append(edge['source'])
    
    # Track execution state for merge nodes
    executed_nodes: Dict[str, bool] = {n['id']: False for n in nodes}
    ready_nodes: List[str] = [n['id'] for n in nodes if len(in_edges[n['id']]) == 0]  # Start nodes
    
    results = []
    errors = []
    
    try:
        while ready_nodes:
            node_id = ready_nodes.pop(0)
            if executed_nodes[node_id]:
                continue
            
            node = next((n for n in nodes if n['id'] == node_id), None)
            if not node:
                continue
            
            node_type = node.get('type', '')
            node_data = node.get('data', {})
            # Support both: action field and node_type as action
            action = node_data.get('action', '') or node_type
            config = node_data.get('config', {})
            
            # For merge nodes, check if all inputs are ready
            if node_type == 'merge':
                predecessors = in_edges.get(node_id, [])
                if not all(executed_nodes.get(p, False) for p in predecessors):
                    ready_nodes.append(node_id)  # Re-queue for later
                    continue
            
            try:
                result = execute_action(page, action, config)
                results.append({
                    'node_id': node_id,
                    'node_type': node_type,
                    'action': action,
                    'result': result,
                })
                executed_nodes[node_id] = True
                
                # Add successors to ready queue
                successors = [e['target'] for e in edges if e['source'] == node_id]
                for succ_id in successors:
                    if not executed_nodes[succ_id]:
                        # Check if this successor is a merge with all predecessors done
                        preds = in_edges.get(succ_id, [])
                        if all(executed_nodes.get(p, False) for p in preds):
                            ready_nodes.append(succ_id)
            
            except Exception as e:
                error_msg = f"Action {action} failed on node {node_id}: {str(e)}"
                errors.append(error_msg)
                results.append({
                    'node_id': node_id,
                    'node_type': node_type,
                    'action': action,
                    'error': str(e),
                })
                executed_nodes[node_id] = True
                # Stop on error
                break
        
        # Check if all nodes were executed
        if not all(executed_nodes.values()):
            unreached = [nid for nid, ex in executed_nodes.items() if not ex]
            errors.append(f"Nodes never reached: {unreached}")
        
        return {
            "success": len(errors) == 0,
            "results": results,
            "errors": errors,
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Workflow execution failed: {str(e)}",
            "results": results,
        }


def execute_action(page: Page, action: str, config: Dict[str, Any]) -> Any:
    """Execute a single action on Playwright page."""
    
    # Normalize action name (support both 'openPage' and 'openpage')
    action = action.lower() if action else ''
    
    if action == 'openpage' or action == 'open_page':
        url = config.get('url', '')
        if not url:
            raise ValueError("openPage requires 'url' in config")
        page.goto(url, wait_until='networkidle', timeout=30000)
        return {"url": page.url}
    
    elif action == 'waitselector' or action == 'wait_selector':
        selector = config.get('selector', '')
        timeout = config.get('timeout', 5000)
        if not selector:
            raise ValueError("waitSelector requires 'selector' in config")
        page.wait_for_selector(selector, timeout=timeout)
        return {"found": True}
    
    elif action == 'click':
        selector = config.get('selector', '')
        if not selector:
            raise ValueError("click requires 'selector' in config")
        page.click(selector)
        return {"clicked": True}
    
    elif action == 'typetext' or action == 'type_text':
        selector = config.get('selector', '')
        text = config.get('text', '')
        if not selector:
            raise ValueError("typeText requires 'selector' in config")
        page.fill(selector, text)
        return {"typed": True, "text_length": len(text)}
    
    elif action == 'screenshot':
        path = config.get('path', None)
        screenshot_data = page.screenshot(path=path, full_page=True)
        return {"screenshot": path if path else "captured", "bytes": len(screenshot_data) if screenshot_data else 0}
    
    elif action == 'closepage' or action == 'close_page':
        page.close()
        return {"closed": True}
    
    elif action == 'start':
        return {"status": "started"}
    
    elif action == 'end':
        return {"status": "ended"}
    
    elif action == 'merge':
        return {"status": "merged"}
    
    else:
        raise ValueError(f"Unknown action: {action}")

