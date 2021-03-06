<script>
    import MatrixAvatar from './MatrixAvatar.svelte';
    import MImage from './event/MImage.svelte';
    import Reply from './event/Reply.svelte';
    import SenderNetworkIcon from './SenderNetworkIcon.svelte';

    import * as HtmlUtils from './html-utils.js';
	import { createEventDispatcher, onMount, getContext, beforeUpdate } from 'svelte';
    import { key } from './matrix.js';
    import { getImageHeight, getParentEventId, getViewType } from './event-utils.js';
    
    const dispatch = createEventDispatcher();

	const { getClient } = getContext(key);
    const client = getClient();

    export let event;
    export let room;
    export let showSender;
    export let width;

    let messageElement;

    function getMessageText() {
        let content;
        if (event.replacingEvent()) { content = event.replacingEvent().getContent()['m.new_content'] }
        else { content = event.getContent(); }

        const stripReply = getParentEventId(event);
        if ('body' in content) {
            return HtmlUtils.bodyToHtml(content, [], {
                disableBigEmoji: content.msgtype === "m.emote",
                stripReplyFallback: stripReply,
            });
        }
        else { return "Unsupported message"; }
    }

    function getTimestamp(event) {
        return new Date(event.getTs()).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit'});
    }

    let imageWidth = width/2;
    let imageHeight = getImageHeight(event, imageWidth);

    let edited;
    let messageText;
    let messageViewType = getViewType(event);

    let replyEventId;
    let replyTo;

    let timestamp = getTimestamp(event);

    function update() {
        edited = !!event.replacingEvent();
        messageText = getMessageText();
        messageViewType = getViewType(event);
        replyEventId = getParentEventId(event);
        replyTo = room.findEventById(replyEventId);
        ///timestamp;

    }

    onMount(() => {
        update();
        timestamp = getTimestamp(event);
        HtmlUtils.linkifyElement(messageElement);
    });
    beforeUpdate(update);
</script>
<style>
.edited {
    opacity: 0.5;
    font-size: 0.8em;
}

.avatarwrapper {
    height: 0;
    overflow: visible;
}
.sendername {
    overflow-wrap: break-word;
    word-wrap: break-word;
    display: flex;
}
.message {
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
}

:global(a) {
    overflow-wrap: break-word;
    word-wrap: break-word;
}
 
.message :global(pre) {
    overflow-x: scroll;
}
.message :global(p) {
    margin-top: 0.5em;
    margin-bottom: 0;
}
.message :global(p):first-of-type {
    margin-top: 0em;
}
.reply {
    border-left: 2px solid grey;
    padding-left: 0.5em;
    margin-top: 0.25em;
    margin-bottom: 0.25em;
    max-width: 400px;
    margin-right: 2em;
}
.timestamp {
    font-size: 0.6rem;
    position: absolute;
    bottom: 0;
    text-align: center;
    margin-bottom: 0.6rem;
}

.avatar {
    width: 1.75em;
    height: 1.75em;
    margin-left: 0.625em;
}
.sendername {
    margin-left: 3em;
    margin-top: 0.5em;
    margin-bottom: 0.3em;
    font-weight: bold;
}
.reply {
    margin-left: 3em;
}
.message {
    margin-left: 3em;
    margin-bottom: 0.5em;
    margin-right: 1em;
}
.timestamp {
    width: 3rem;
}
</style>
{#if showSender}
    {#if event.sender}
        <div class="avatarwrapper">
            <div class="avatar">
                <MatrixAvatar size="1" imageUrl={event.sender.getAvatarUrl(client.baseUrl)} name={event.sender.name}></MatrixAvatar>
            </div>
        </div>
        <div class="sendername">{event.sender.name} <SenderNetworkIcon userId={event.getSender()}></SenderNetworkIcon></div>
    {:else}
        <div class="avatarwrapper">
            <div class="avatar">
                <MatrixAvatar size="1" name={event.getSender().charAt(1)}></MatrixAvatar>
            </div>
        </div>
        <span class="sendername">{event.getSender()} <SenderNetworkIcon userId={event.getSender()}></SenderNetworkIcon></span>
    {/if}
{/if}
{#if replyEventId !== undefined}
    <div class="reply">
        {#if replyTo !== undefined}
            <Reply event={replyTo}></Reply>
        {:else}
            loading...
        {/if}
    </div>
{/if}
<div class="message" bind:this={messageElement}>
    {#if messageViewType === "text"}
        {#if messageText.isDisplayedWithHtml}{@html messageText.text}{:else}{messageText.text}{/if}
        {#if edited}<span class="edited">(edited)</span>{/if}
    {:else if messageViewType === "image"}
        <div style="width: {imageWidth}px; height: {imageHeight}px;"><MImage {event}></MImage></div>
    {/if}
</div>
<span class="timestamp">{timestamp}</span>
