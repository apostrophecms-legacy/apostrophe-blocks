# apostrophe-blocks

`apostrophe-blocks` allows users to alternate one-column and two-column blocks in a single page on an [apostrophe-sandbox](https://github.com/apostrophe-sandbox)-powered website. Users may opt to have just a single one-column block, or a single two-column block, or a mix of the two.

But it actually does more than that. As the developer, you may define as many types of blocks as you wish, not just simple one- and two-column blocks. If you can do it in a regular page template, you can do it in a block template.

## Installation

*I assume you already have a nifty Apostrophe 2 project built with [apostrophe-site](https://github.com/punkave/apostrophe-site). The easiest way is to start by cloning the [apostrophe-sandbox](https://github.com/apostrophe-sandbox) project.*

Add the module to your project:

npm install --save apostrophe-blocks

## Configuration

In `app.js`, you'll need to configure the `apostrophe-blocks` module, just like the rest of your modules:

```javascript
    'apostrophe-blocks': {
      types: [
        {
          name: 'one',
          label: 'One Column'
        },
        {
          name: 'two',
          label: 'Two Column'
        }
      ]
    }
```

Now add an `aposBlocks` call to one of your page templates:

    {{ aposBlocks(page, 'main', [ 'one', 'two' ]) }}

Restart your site and... BOOM! That's it. When editing you can now add blocks as you see fit. Within each block you have the usual area-editing controls, for one area or two side-by-side areas, respectively. You can also re-order the blocks via the drag handle, or remove them.

## Creating Your Own Block Templates

OK, you caught me. That's not really everything. You don't want to use my crappy example block templates. (Especially not with that nasty inline style element, am I right?)

So, let's make our own.

First create a `views` folder for your project's overrides of the blocks module:

mkdir -p lib/modules/apostrophe-blocks/views

Now, in that folder, create `one.html` and paste in:

```twig
{{ aposArea(page, prefix + 'left') }}
```

Much more exciting, let's create `two.html`:

```twig
<div class="left">
  {{ aposArea(page, prefix + 'left') }}
</div>
<div class="right">
  {{ aposArea(page, prefix + 'right') }}
</div>
```

See what I did there? Each block template can contain its own calls to `aposArea`. All you have to do is **always remember to append your own area name to `prefix`.* If you forget to do this, all your blocks will show the same content, and you will be sad.

Also works with Singletons:

```twig
{{ aposSingleton(page, prefix + 'marquee', 'slideshow', {}) }}
```

"Hey, my two columns aren't showing up as columns!" Well no, of course not, I didn't write any CSS for those `left` and `right` classes on the wrapper `div` elements. It's your job to do that in your project's `site.less` file.

## Limitations

Blocks cannot be edited inside the modal dialog boxes for editing blog posts, events, etc. However, you may introduce them in the `show.html` templates for such things.

Since blocks are inherently very much a WYSIWYG beast, we feel it would not be worth the considerable effort required to make them work in modals.
