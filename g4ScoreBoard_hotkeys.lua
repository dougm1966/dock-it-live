--[[
      OBS Studio Lua script : Legacy hotkey wrapper (delegates to PCPL_hotkeys.lua)
--]]

local obs = obslua

-- Backward-compatible wrapper.
-- Existing OBS profiles may still reference this file name.
-- This delegates to PCPL_hotkeys.lua located in the same directory.

local function _read_all(path)
	local f = io.open(path, "r")
	if not f then return nil end
	local content = f:read("*a")
	f:close()
	return content
end

local function _load_delegate()
	local delegate_path = script_path() .. 'PCPL_hotkeys.lua'
	local content = _read_all(delegate_path)
	if not content then
		obs.script_log(obs.LOG_ERROR, "Missing PCPL_hotkeys.lua next to legacy hotkey wrapper")
		return false
	end
	local chunk, err = load(content, '@' .. delegate_path)
	if not chunk then
		obs.script_log(obs.LOG_ERROR, "Failed to load PCPL_hotkeys.lua: " .. tostring(err))
		return false
	end
	chunk()
	return true
end

if not _load_delegate() then
	-- If delegate fails, OBS will still load this script, but there will be no hotkeys.
end