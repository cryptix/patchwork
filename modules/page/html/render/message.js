var { h, when, map, Proxy, Struct, Value, computed } = require('mutant')
var nest = require('depnest')
var ref = require('ssb-ref')
var AnchorHook = require('../../../../lib/anchor-hook')

exports.needs = nest({
  'keys.sync.id': 'first',
  'feed.obs.thread': 'first',
  'message.sync.unbox': 'first',
  'message.html': {
    render: 'first',
    compose: 'first'
  },
  'sbot.async.get': 'first',
  'intl.sync.i18n': 'first'
})

exports.gives = nest('page.html.render')

exports.create = function (api) {
  const i18n = api.intl.sync.i18n
  return nest('page.html.render', function (id) {
    if (!ref.isMsg(id)) return
    var loader = h('div', {className: 'Loading -large'})

    var result = Proxy(loader)
    var anchor = Value()

    var meta = Struct({
      type: 'post',
      root: Proxy(id),
      branch: Proxy(id),
      channel: Value(undefined),
      recps: Value(undefined)
    })

    var compose = api.message.html.compose({
      meta,
      isPrivate: when(meta.recps, true),
      shrink: false,
      hooks: [
        AnchorHook('reply', anchor, (el) => el.focus())
      ],
      placeholder: when(meta.recps, i18n('Write a private reply'), i18n('Write a public reply'))
    })

    api.sbot.async.get(id, (err, value) => {
      if (err) {
        return result.set(h('PageHeading', [
          h('h1', i18n('Cannot load thead'))
        ]))
      }

      if (typeof value.content === 'string') {
        value = api.message.sync.unbox(value)
      }

      if (!value) {
        return result.set(h('PageHeading', [
          h('h1', i18n('Cannot display message.'))
        ]))
      }

      // what happens in private stays in private!
      meta.recps.set(value.content.recps)

      var isReply = !!value.content.root
      var thread = api.feed.obs.thread(id, {branch: isReply})

      meta.channel.set(value.content.channel)
      meta.root.set(value.content.root || thread.rootId)

      // if root thread, reply to last post
      meta.branch.set(isReply ? thread.branchId : thread.lastId)

      var container = h('Thread', [
        h('div.messages', [
          when(thread.branchId, h('a.full', {href: thread.rootId, anchor: id}, [i18n('View full thread')])),
          map(thread.messages, (msg) => {
            return computed([msg, thread.previousKey(msg)], (msg, previousId) => {
              return h('div', {
                hooks: [AnchorHook(msg.key, anchor, showContext)]
              }, [
                api.message.html.render(msg, {
                  pageId: id,
                  previousId,
                  includeReferences: true
                })
              ])
            })
          }, {
            maxTime: 5,
            idle: true
          })
        ]),
        compose
      ])
      result.set(when(thread.sync, container, loader))
    })

    var view = h('div', {className: 'SplitView'}, [
      h('div.main', [
        result
      ])
    ])

    view.setAnchor = function (value) {
      anchor.set(value)
    }

    return view
  })
}

function showContext (element) {
  var scrollParent = getScrollParent(element)
  if (scrollParent) {
    // ensure context is visible
    scrollParent.scrollTop = Math.max(0, scrollParent.scrollTop - 100)
  }
}

function getScrollParent (element) {
  while (element.parentNode) {
    if (element.parentNode.scrollTop > 10) {
      return element.parentNode
    } else {
      element = element.parentNode
    }
  }
}
