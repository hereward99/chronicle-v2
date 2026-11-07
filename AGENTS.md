# Architecture rules

- Use the shared CastPicker through GroupMembersPanel for character membership editing; keep persistence callbacks in the owning editor so session drafts and immediate group updates retain their existing save behavior.
- Calculate cast changes only against characters supplied by the chronicle-scoped parent, preserving memberships absent from the visible candidate list.
- Keep named character views as browser-local snapshots scoped by authenticated user and chronicle; key the saved-view controls by that scope to prevent cross-scope state reuse without changing existing toolbar persistence.