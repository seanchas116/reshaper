use swc_core::common::FileName::Real;
use swc_core::common::SourceMapper;
use swc_core::ecma::ast::{
    Ident, JSXAttr, JSXAttrName, JSXAttrOrSpread, JSXAttrValue, JSXElement, Lit, Str,
};
use swc_core::ecma::transforms::testing::{test, test_inline};
use swc_core::ecma::visit::VisitMutWith;
use swc_core::ecma::{
    ast::Program,
    visit::{as_folder, FoldWith, VisitMut},
};
use swc_core::plugin::plugin_transform;
use swc_core::plugin::proxies::{PluginSourceMapProxy, TransformPluginProgramMetadata};
use swc_ecma_parser::{Syntax, TsConfig};

pub struct TransformVisitor {
    source_map: PluginSourceMapProxy,
}

impl VisitMut for TransformVisitor {
    fn visit_mut_jsx_element(&mut self, jsx: &mut JSXElement) {
        let mut opening = jsx.opening.clone();

        let pos = self.source_map.lookup_char_pos(opening.span.lo);
        let name_str = match pos.file.name.clone() {
            Real(path) => {
                let p = path.as_path();
                p.to_str().map(|s| s.to_string())
            }
            _ => None,
        };

        let loc = format!(
            "{}:{}:{}",
            name_str.unwrap_or("".to_string()),
            pos.line,
            pos.col.0
        );

        opening.attrs.push(JSXAttrOrSpread::JSXAttr(JSXAttr {
            span: opening.span,
            name: JSXAttrName::Ident(Ident::new("data-reshaper-loc".into(), opening.span)),
            value: Some(JSXAttrValue::Lit(Lit::Str(
                Str {
                    span: opening.span,
                    value: loc.clone().into(),
                    raw: None,
                }
                .into(),
            ))),
        }));

        jsx.opening = opening;

        jsx.visit_mut_children_with(self);
    }
}

/// An example plugin function with macro support.
/// `plugin_transform` macro interop pointers into deserialized structs, as well
/// as returning ptr back to host.
///
/// It is possible to opt out from macro by writing transform fn manually
/// if plugin need to handle low-level ptr directly via
/// `__transform_plugin_process_impl(
///     ast_ptr: *const u8, ast_ptr_len: i32,
///     unresolved_mark: u32, should_enable_comments_proxy: i32) ->
///     i32 /*  0 for success, fail otherwise.
///             Note this is only for internal pointer interop result,
///             not actual transform result */`
///
/// This requires manual handling of serialization / deserialization from ptrs.
/// Refer swc_plugin_macro to see how does it work internally.
#[plugin_transform]
pub fn process_transform(program: Program, metadata: TransformPluginProgramMetadata) -> Program {
    // let src = metadata.source_map.source_file.get().src.clone();
    // let line_col_mapping = LineColMapping::new(src);
    program.fold_with(&mut as_folder(TransformVisitor {
        source_map: metadata.source_map,
    }))
}

// An example to test plugin transform.
// Recommended strategy to test plugin's transform is verify
// the Visitor's behavior, instead of trying to run `process_transform` with mocks
// unless explicitly required to do so.

// TODO: load source from file instead of hardcoding it.
// test_inline!(
//     Syntax::Typescript(TsConfig {
//         tsx: true,
//         ..Default::default()
//     }),
//     |_| {
//         as_folder(TransformVisitor::new(LineColMapping::new(
//             r#"const x = <div>
//   <h1>Hello</h1>
// </div>;"#,
//         )))
//     },
//     boo,
//     // Input codes
//     r#"const x = <div>
//   <h1>Hello</h1>
// </div>;"#,
//     // Output codes after transformed with plugin
//     r#"const x = <div data-reshaper-loc="file:1:10">
//   <h1 data-reshaper-loc="file:2:2">Hello</h1>
// </div>;"#
// );

// TODO: test with JavaScript SWC API (where source map is available)
